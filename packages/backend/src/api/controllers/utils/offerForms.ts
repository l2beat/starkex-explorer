import {
  AcceptedData,
  CreateOfferData,
  FinalizeOfferData,
} from '@explorer/shared'
import { EthereumAddress, StarkKey, Timestamp } from '@explorer/types'

import { ForcedTradeOfferRecord } from '../../../peripherals/database/ForcedTradeOfferRepository'

const THREE_DAYS_IN_MILLIS = 3 * 24 * 60 * 60 * 1000

interface User {
  starkKey: StarkKey
  positionId: bigint
  address: EthereumAddress
}

interface AcceptForm extends CreateOfferData, AcceptedData {
  id: number
  address: EthereumAddress
}

export function getAcceptForm(
  offer: ForcedTradeOfferRecord,
  user: User
): AcceptForm | undefined {
  const isAcceptable = !offer.accepted && !offer.cancelledAt
  const shouldRenderForm = isAcceptable && user.positionId !== offer.positionIdA
  const submissionExpirationTime = Timestamp(
    BigInt(Math.floor(Date.now() + THREE_DAYS_IN_MILLIS))
  )
  if (!shouldRenderForm) {
    return undefined
  }
  return {
    nonce: BigInt(Date.now()),
    positionIdA: offer.positionIdA,
    positionIdB: user.positionId,
    premiumCost: false,
    starkKeyA: offer.starkKeyA,
    starkKeyB: user.starkKey,
    submissionExpirationTime,
    isABuyingSynthetic: offer.isABuyingSynthetic,
    address: user.address,
    collateralAmount: offer.collateralAmount,
    syntheticAmount: offer.syntheticAmount,
    id: offer.id,
    syntheticAssetId: offer.syntheticAssetId,
  }
}

interface CancelForm {
  address: EthereumAddress
  offerId: number
}

export function getCancelForm(
  offer: ForcedTradeOfferRecord,
  user: User
): CancelForm | undefined {
  const isOwner = user.positionId === offer.positionIdA
  const isCancellable = !offer.cancelledAt
  const shouldRenderForm = isOwner && isCancellable
  if (!shouldRenderForm) {
    return undefined
  }
  return {
    address: user.address,
    offerId: offer.id,
  }
}

interface FinalizeForm extends FinalizeOfferData {
  offerId: number
  address: EthereumAddress
  perpetualAddress: EthereumAddress
}

export function getFinalizeForm(
  offer: ForcedTradeOfferRecord,
  user: User,
  perpetualAddress: EthereumAddress
): FinalizeForm | undefined {
  const isOwner = user.positionId === offer.positionIdA
  if (!(offer.accepted && !offer.cancelledAt && isOwner)) {
    return undefined
  }
  return {
    offerId: offer.id,
    nonce: offer.accepted.nonce,
    positionIdA: offer.positionIdA,
    positionIdB: offer.accepted.positionIdB,
    premiumCost: offer.accepted.premiumCost,
    starkKeyA: offer.starkKeyA,
    starkKeyB: offer.accepted.starkKeyB,
    submissionExpirationTime: offer.accepted.submissionExpirationTime,
    isABuyingSynthetic: offer.isABuyingSynthetic,
    collateralAmount: offer.collateralAmount,
    syntheticAmount: offer.syntheticAmount,
    syntheticAssetId: offer.syntheticAssetId,
    address: user.address,
    perpetualAddress,
    signature: offer.accepted.signature,
  }
}
