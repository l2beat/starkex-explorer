import { renderOfferAndForcedTradePage } from '@explorer/frontend'
import { CollateralAsset, UserDetails } from '@explorer/shared'
import { EthereumAddress, Timestamp } from '@explorer/types'

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
  getAcceptOfferFormData,
  getCancelOfferFormData,
  getFinalizeOfferFormData,
} from './utils/offerForms'

export class ForcedTradeOfferController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly offerRepository: ForcedTradeOfferRepository,
    private readonly positionRepository: PositionRepository,
    private readonly userRegistrationEventRepository: UserRegistrationEventRepository,
    private readonly collateralAsset: CollateralAsset,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async getOfferDetailsPage(
    id: number,
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContext(givenUser)

    if (context.tradingMode != 'perpetual') {
      return { type: 'not found', message: 'Page not found.' }
    }

    const offer = await this.offerRepository.findById(id)

    if (!offer) {
      return { type: 'not found', message: 'Offer not found.' }
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
      collateralAmount: offer.collateralAmount,
      syntheticAsset: { hashOrId: offer.syntheticAssetId },
      syntheticAmount: offer.syntheticAmount,
      expirationTimestamp: offer.accepted?.submissionExpirationTime,
      history: transactionHistory.getForcedTradeTransactionHistory(),
      acceptOfferFormData:
        user && getAcceptOfferFormData(offer, user, context.collateralAsset),
      cancelOfferFormData: user && getCancelOfferFormData(offer, user),
      finalizeOfferFormData:
        user &&
        getFinalizeOfferFormData(
          offer,
          user,
          this.perpetualAddress,
          context.collateralAsset
        ),
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
      return {
        type: 'not found',
        message: `Position #${positionA} does not exist`,
      }
    }
    const requestValid = validateCreate(
      offer,
      positionA,
      signature,
      userA.ethAddress
    )
    if (!requestValid) {
      return { type: 'bad request', message: 'Your offer is invalid' }
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
      return { type: 'not found', message: 'Position does not exist.' }
    }
    const offer = await this.offerRepository.findById(offerId)
    if (!offer) {
      return { type: 'not found', message: 'Offer does not exist.' }
    }
    if (offer.accepted) {
      return {
        type: 'bad request',
        message: 'Offer already accepted.',
      }
    }
    if (offer.cancelledAt) {
      return {
        type: 'bad request',
        message: 'Offer already cancelled.',
      }
    }
    const signatureValid = validateAcceptSignature(
      offer,
      accepted,
      userB.ethAddress,
      this.collateralAsset
    )
    if (!signatureValid) {
      return { type: 'bad request', message: 'Invalid signature.' }
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
        message: 'Offer does not exist.',
      }
    }
    if (offer.cancelledAt) {
      return {
        type: 'bad request',
        message: 'Offer already cancelled.',
      }
    }
    if (offer.accepted?.transactionHash) {
      return {
        type: 'bad request',
        message: 'Offer already submitted.',
      }
    }
    const userA = await this.userRegistrationEventRepository.findByStarkKey(
      offer.starkKeyA
    )
    if (!userA) {
      return { type: 'not found', message: 'Position does not exist.' }
    }
    const requestValid = validateCancel(offer.id, userA.ethAddress, signature)
    if (!requestValid) {
      return {
        type: 'bad request',
        message: 'Signature does not match.',
      }
    }

    await this.offerRepository.update({
      ...offer,
      cancelledAt: Timestamp.now(),
    })

    return { type: 'success', content: 'Offer cancelled.' }
  }
}
