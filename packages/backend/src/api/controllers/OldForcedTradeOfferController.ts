import {
  renderOldForcedTradeOfferDetailsPage,
  renderOldForcedTradeOffersIndexPage,
} from '@explorer/frontend'
import { CollateralAsset } from '@explorer/shared'
import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'

import { AccountService } from '../../core/AccountService'
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
import { toForcedTradeOfferEntry } from './utils/toForcedTradeOfferEntry'
import { toForcedTradeOfferHistory } from './utils/toForcedTradeOfferHistory'

export class OldForcedTradeOfferController {
  constructor(
    private accountService: AccountService,
    private offerRepository: ForcedTradeOfferRepository,
    private positionRepository: PositionRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository,
    private collateralAsset: CollateralAsset,
    private perpetualAddress: EthereumAddress
  ) {}

  async getOffersIndexPage({
    page,
    perPage,
    assetId,
    type,
    address,
  }: {
    page: number
    perPage: number
    assetId?: AssetId
    type?: 'buy' | 'sell'
    address: EthereumAddress | undefined
  }): Promise<ControllerResult> {
    const [account, total, offers, assetIds] = await Promise.all([
      this.accountService.getAccount(address),
      this.offerRepository.countInitial({ assetId, type }),
      this.offerRepository.getInitial({
        offset: (page - 1) * perPage,
        limit: perPage,
        assetId,
        type,
      }),
      this.offerRepository.getInitialAssetIds(),
    ])

    const content = renderOldForcedTradeOffersIndexPage({
      account,
      offers: offers.map(toForcedTradeOfferEntry),
      total,
      assetIds,
      params: { page, perPage, type, assetId },
    })
    return { type: 'success', content }
  }

  async getOfferDetailsPage(
    id: number,
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [account, offer] = await Promise.all([
      this.accountService.getAccount(address),
      this.offerRepository.findById(id),
    ])
    if (!offer) {
      return {
        type: 'not found',
        content: 'Offer not found.',
      }
    }

    if (offer.accepted?.transactionHash) {
      return {
        type: 'redirect',
        url: `/forced/${offer.accepted.transactionHash.toString()}`,
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
    const [userPositionId, userEvent] = await Promise.all([
      address && this.positionRepository.findIdByEthereumAddress(address),
      address &&
        this.userRegistrationEventRepository.findByEthereumAddress(address),
    ])
    const user =
      userPositionId && userEvent
        ? {
            address: userEvent.ethAddress,
            starkKey: userEvent.starkKey,
            positionId: userPositionId,
          }
        : undefined

    const content = renderOldForcedTradeOfferDetailsPage({
      account,
      history: toForcedTradeOfferHistory(offer),
      offer: {
        type: offer.isABuyingSynthetic ? 'buy' : 'sell',
        id,
        addressA: userA.ethAddress,
        positionIdA: offer.positionIdA,
        collateralAmount: offer.collateralAmount,
        syntheticAmount: offer.syntheticAmount,
        syntheticAssetId: offer.syntheticAssetId,
        positionIdB: offer.accepted?.positionIdB,
        addressB: userB?.ethAddress,
      },
      acceptForm:
        user && getAcceptOfferFormData(offer, user, this.collateralAsset),
      cancelForm: user && getCancelOfferFormData(offer, user),
      finalizeForm:
        user && getFinalizeOfferFormData(offer, user, this.perpetualAddress),
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
      userB.ethAddress,
      this.collateralAsset
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
