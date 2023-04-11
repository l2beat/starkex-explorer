import { renderOfferAndForcedTradePage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Timestamp } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { PageContextService } from '../../core/PageContextService'
import { TransactionHistory } from '../../core/TransactionHistory'
import {
  Accepted,
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'
import {
  validateAcceptSignature,
  validateCancel,
  validateCreate,
} from './utils/ForcedTradeOfferValidators'
import {
  getAcceptForm,
  getCancelForm,
  getFinalizeForm,
} from './utils/offerForms'

export class ForcedTradeOfferController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly offerRepository: ForcedTradeOfferRepository,
    private readonly positionRepository: PositionRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly collateralAsset: CollateralAsset | undefined,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async getOfferDetailsPage(
    id: number,
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    if (!this.collateralAsset) {
      throw new Error(
        'Collateral asset not passed when displaying ForcedTradeOffer'
      )
    }

    const context = await this.pageContextService.getPageContext(givenUser)

    const offer = await this.offerRepository.findById(id)

    if (!offer) {
      return { type: 'not found', content: 'Offer not found.' }
    }

    if (offer.accepted?.transactionHash) {
      return {
        type: 'redirect',
        url: `/transactions/${offer.accepted.transactionHash.toString()}`,
      }
    }

    const [userA, userB] = await Promise.all([
      this.userRegistrationEventRepository.findByStarkKey(offer.starkKeyA),
      offer.accepted
        ? this.userRegistrationEventRepository.findByStarkKey(
            offer.accepted.starkKeyB
          )
        : undefined,
    ])

    if (!userA) {
      throw new Error('User A not found')
    }

    const maker = {
      starkKey: userA.starkKey,
      ethereumAddress: userA.ethAddress,
      positionId: offer.positionIdA.toString(),
    }
    const taker =
      userB && offer.accepted
        ? {
            starkKey: userB.starkKey,
            ethereumAddress: userB.ethAddress,
            positionId: offer.accepted.positionIdB.toString(),
          }
        : undefined

    const [userPositionId, userEvent] = await Promise.all([
      context.user &&
        this.positionRepository.findIdByEthereumAddress(context.user.address),
      context.user &&
        this.userRegistrationEventRepository.findByEthereumAddress(
          context.user.address
        ),
    ])
    const user =
      userPositionId && userEvent
        ? {
            address: userEvent.ethAddress,
            starkKey: userEvent.starkKey,
            positionId: userPositionId,
          }
        : undefined
    const transactionHistory = new TransactionHistory({
      forcedTradeOffer: offer,
    })

    const content = renderOfferAndForcedTradePage({
      context,
      offerId: id.toString(),
      transactionHash: offer.accepted?.transactionHash,
      maker,
      taker,
      type: offer.isABuyingSynthetic ? 'BUY' : 'SELL',
      collateralAsset: { hashOrId: this.collateralAsset.assetId },
      collateralAmount: offer.collateralAmount,
      syntheticAsset: { hashOrId: offer.syntheticAssetId },
      syntheticAmount: offer.syntheticAmount,
      expirationTimestamp: offer.accepted?.submissionExpirationTime,
      history: transactionHistory.getForcedTradeTransactionHistory(),
      acceptForm: user && getAcceptForm(offer, user),
      cancelForm: user && getCancelForm(offer, user),
      finalizeForm: user && getFinalizeForm(offer, user, this.perpetualAddress),
    })

    return { type: 'success', content }
  }

  async postOffer(
    offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
    signature: string
  ): Promise<ControllerResult> {
    const positionA = await this.positionRepository.findById(offer.positionIdA)
    const userA = await this.userRegistrationEventRepository.findByStarkKey(
      offer.starkKeyA
    )

    if (!positionA || !userA) {
      return { type: 'not found', content: 'Position does not exist.' }
    }
    const requestValid = validateCreate(
      offer,
      positionA,
      signature,
      userA.ethAddress
    )
    if (!requestValid) {
      return { type: 'bad request', content: 'Your offer is invalid.' }
    }

    const id = await this.offerRepository.add({
      createdAt: Timestamp.now(),
      ...offer,
    })

    return { type: 'created', content: { id } }
  }

  async acceptOffer(
    offerId: number,
    accepted: Omit<Accepted, 'at'>
  ): Promise<ControllerResult> {
    const positionB = await this.positionRepository.findById(
      accepted.positionIdB
    )
    const userB = await this.userRegistrationEventRepository.findByStarkKey(
      accepted.starkKeyB
    )
    if (!positionB || !userB) {
      return { type: 'not found', content: 'Position does not exist.' }
    }
    const offer = await this.offerRepository.findById(offerId)
    if (!offer) {
      return { type: 'not found', content: 'Offer does not exist.' }
    }
    if (offer.accepted) {
      return {
        type: 'bad request',
        content: 'Offer already accepted.',
      }
    }
    if (offer.cancelledAt) {
      return {
        type: 'bad request',
        content: 'Offer already cancelled.',
      }
    }
    const signatureValid = validateAcceptSignature(
      offer,
      accepted,
      userB.ethAddress
    )
    if (!signatureValid) {
      return { type: 'bad request', content: 'Invalid signature.' }
    }

    await this.offerRepository.update({
      ...offer,
      accepted: {
        ...accepted,
        at: Timestamp.now(),
      },
    })

    return { type: 'success', content: 'Accept offer was submitted.' }
  }

  async cancelOffer(
    offerId: number,
    signature: string
  ): Promise<ControllerResult> {
    const offer = await this.offerRepository.findById(offerId)
    if (!offer) {
      return {
        type: 'not found',
        content: 'Offer does not exist.',
      }
    }
    if (offer.cancelledAt) {
      return {
        type: 'bad request',
        content: 'Offer already cancelled.',
      }
    }
    if (offer.accepted?.transactionHash) {
      return {
        type: 'bad request',
        content: 'Offer already submitted.',
      }
    }
    const userA = await this.userRegistrationEventRepository.findByStarkKey(
      offer.starkKeyA
    )
    if (!userA) {
      return { type: 'not found', content: 'Position does not exist.' }
    }
    const requestValid = validateCancel(offer.id, userA.ethAddress, signature)
    if (!requestValid) {
      return {
        type: 'bad request',
        content: 'Signature does not match.',
      }
    }

    await this.offerRepository.update({
      ...offer,
      cancelledAt: Timestamp.now(),
    })

    return { type: 'success', content: 'Offer cancelled.' }
  }
}
