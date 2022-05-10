import { Timestamp } from '@explorer/types'

import {
  ForceTradeAcceptRecord,
  ForceTradeInitialOfferRecord,
  OfferRepository,
} from '../../peripherals/database/OfferRepository'
import {
  PositionRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'

export class OfferController {
  constructor(
    private offerRepository: OfferRepository,
    private stateUpdateRepository: StateUpdateRepository
  ) {}

  async postOffer(
    offer: Omit<ForceTradeInitialOfferRecord, 'createdAt' | 'id'>
  ): Promise<ControllerResult> {
    const positionA = await this.stateUpdateRepository.getPositionById(
      offer.positionIdA
    )

    if (!positionA) {
      return { type: 'not found', content: 'Position does not exist.' }
    }

    const offerValidated = validateInitialOffer(offer, positionA)

    if (!offerValidated) {
      return { type: 'bad request', content: 'Your offer is invalid.' }
    }

    const createdAt = Timestamp(Date.now())

    const id = await this.offerRepository.addInitialOffer({
      createdAt,
      ...offer,
    })
    return { type: 'created', content: { id } }
  }

  async acceptOffer(
    initialOfferId: number,
    acceptOfferData: Omit<ForceTradeAcceptRecord, 'acceptedAt'>
  ): Promise<ControllerResult> {
    const positionB = await this.stateUpdateRepository.getPositionById(
      acceptOfferData.positionIdB
    )

    if (!positionB) {
      return { type: 'not found', content: 'Position does not exist.' }
    }

    const initialOffer = await this.offerRepository.getInitialOfferById(
      initialOfferId
    )

    const offerValidated = validateAcceptOffer(initialOffer, positionB)

    if (!offerValidated) {
      return { type: 'bad request', content: 'Your offer is invalid' }
    }

    const acceptedAt = Timestamp(Date.now())
    await this.offerRepository.addAcceptOffer(initialOfferId, {
      acceptedAt,
      ...acceptOfferData,
    })

    return { type: 'success', content: 'Accept offer was submitted' }
  }
}

function validateInitialOffer(
  offer: Omit<ForceTradeInitialOfferRecord, 'createdAt' | 'id'>,
  position: PositionRecord
) {
  const userIsBuyingSynthetic = offer.aIsBuyingSynthetic

  return validateBalance(offer, position, userIsBuyingSynthetic)
}

function validateAcceptOffer(
  offer: ForceTradeInitialOfferRecord,
  position: PositionRecord
) {
  const userIsBuyingSynthetic = !offer.aIsBuyingSynthetic

  return validateBalance(offer, position, userIsBuyingSynthetic)
}

function validateBalance(
  offer: Omit<ForceTradeInitialOfferRecord, 'createdAt' | 'id'>,
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
