import { Timestamp } from '@explorer/types'

import {
  OfferRecord,
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
    offer: Omit<OfferRecord, 'createdAt' | 'id'>
  ): Promise<ControllerResult> {
    const positionA = await this.stateUpdateRepository.getPositionById(
      offer.positionIdA
    )

    if (!positionA) {
      return { type: 'bad-request', content: 'Position does not exist.' }
    }

    const offerValidated = validateOffer(offer, positionA)

    if (!offerValidated) {
      return { type: 'bad-request', content: 'Your offer is invalid.' }
    }

    const createdAt = Timestamp(Date.now())

    const id = await this.offerRepository.addOne({ createdAt, ...offer })
    return { type: 'created', content: { id } }
  }
}

export function validateOffer(
  offer: Omit<OfferRecord, 'createdAt' | 'id'>,
  position: PositionRecord
) {
  const {
    amountCollateral,
    amountSynthetic,
    aIsBuyingSynthetic,
    syntheticAssetId,
  } = offer

  const { collateralBalance } = position

  if (aIsBuyingSynthetic && amountCollateral <= collateralBalance) {
    return true
  }

  if (!aIsBuyingSynthetic) {
    const balanceSynthetic = position.balances.find(
      (balance) => balance.assetId === syntheticAssetId
    )?.balance
    if (balanceSynthetic && balanceSynthetic >= amountSynthetic) {
      return true
    }
  }

  return false
}
