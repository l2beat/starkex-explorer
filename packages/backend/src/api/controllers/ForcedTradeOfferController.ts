import {
  digestAcceptedOfferParams,
  stringifyInitialOffer,
} from '@explorer/encoding'
import { renderForcedTradeOffersIndexPage } from '@explorer/frontend'
import { EthereumAddress, Timestamp } from '@explorer/types'
import { hashMessage, recoverAddress } from 'ethers/lib/utils'

import {
  Accepted,
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../peripherals/database/ForcedTradeOfferRepository'
import {
  PositionRecord,
  PositionRepository,
} from '../../peripherals/database/PositionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'
import { toForcedTradeOfferEntry } from './utils/toForcedTradeOfferEntry'

export class ForcedTradeOfferController {
  constructor(
    private offerRepository: ForcedTradeOfferRepository,
    private positionRepository: PositionRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository
  ) {}

  async getOffersIndexPage(
    page: number,
    perPage: number,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [total, offers] = await Promise.all([
      this.offerRepository.initialCount(),
      this.offerRepository.getLatestInitial({
        offset: (page - 1) * perPage,
        limit: perPage,
      }),
    ])

    const content = renderForcedTradeOffersIndexPage({
      account,
      offers: offers.map(toForcedTradeOfferEntry),
      total,
      params: { page, perPage },
    })
    return { type: 'success', content }
  }

  async postOffer(
    offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
    signature: string
  ): Promise<ControllerResult> {
    const positionA = await this.positionRepository.findById(offer.positionIdA)
    const userRegistrationEventA =
      await this.userRegistrationEventRepository.findByStarkKey(offer.starkKeyA)

    if (!positionA || !userRegistrationEventA) {
      return { type: 'not found', content: 'Position does not exist.' }
    }

    const offerValid = validateInitialOffer(
      offer,
      positionA,
      signature,
      userRegistrationEventA.ethAddress
    )

    if (!offerValid) {
      return { type: 'bad request', content: 'Your offer is invalid.' }
    }

    const id = await this.offerRepository.add({
      createdAt: Timestamp(Date.now()),
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
    const userRegistrationEventB =
      await this.userRegistrationEventRepository.findByStarkKey(
        accepted.starkKeyB
      )

    if (!positionB || !userRegistrationEventB) {
      return { type: 'not found', content: 'Position does not exist.' }
    }
    const offer = await this.offerRepository.findById(offerId)

    if (!offer) {
      return { type: 'not found', content: 'Offer does not exist.' }
    }

    if (offer.accepted) {
      return {
        type: 'bad request',
        content: 'Offer already accepted by a user.',
      }
    }

    const offerValid = validateAcceptedOffer(
      offer,
      accepted,
      positionB,
      userRegistrationEventB.ethAddress
    )

    if (!offerValid) {
      return { type: 'bad request', content: 'Your offer is invalid.' }
    }

    await this.offerRepository.save({
      ...offer,
      accepted: {
        ...accepted,
        at: Timestamp(Date.now()),
      },
    })

    return { type: 'success', content: 'Accept offer was submitted.' }
  }
}

function validateInitialOffer(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  position: PositionRecord,
  signature: string,
  ethAddressA: EthereumAddress
) {
  const userIsBuyingSynthetic = offer.aIsBuyingSynthetic

  if (!validateBalance(offer, position, userIsBuyingSynthetic)) {
    return false
  }

  return validateInitialSignature(offer, signature, ethAddressA)
}

function validateAcceptedOffer(
  offer: ForcedTradeOfferRecord,
  accepted: Omit<Accepted, 'at'>,
  position: PositionRecord,
  ethAddressB: EthereumAddress
) {
  const userIsBuyingSynthetic = !offer.aIsBuyingSynthetic

  if (!validateBalance(offer, position, userIsBuyingSynthetic)) {
    return false
  }

  return validateAcceptedSignature(offer, accepted, ethAddressB)
}

function validateBalance(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  position: PositionRecord,
  userIsBuyingSynthetic: boolean
) {
  const { amountCollateral, amountSynthetic, syntheticAssetId } = offer

  const { collateralBalance } = position

  if (userIsBuyingSynthetic && amountCollateral <= collateralBalance) {
    return true
  }

  if (!userIsBuyingSynthetic) {
    const balanceSynthetic = position.balances.find(
      (balance) => balance.assetId === syntheticAssetId
    )?.balance
    if (balanceSynthetic && balanceSynthetic >= amountSynthetic) {
      return true
    }
  }

  return false
}

export function validateInitialSignature(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  signature: string,
  address: EthereumAddress
) {
  const stringOffer = stringifyInitialOffer(offer)

  const signer = recoverAddress(hashMessage(stringOffer), signature)

  return signer === address.toString()
}

export function validateAcceptedSignature(
  offer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'>,
  accepted: Omit<Accepted, 'at'>,
  address: EthereumAddress
): boolean {
  try {
    const digest = digestAcceptedOfferParams(offer, accepted)

    const signer = recoverAddress(digest, accepted.signature)

    return signer === address.toString()
  } catch (e) {
    return false
  }
}
