import { AssetId, StarkKey } from '@explorer/types'

export interface OfferData {
  starkKeyA: StarkKey
  positionIdA: bigint
  syntheticAssetId: AssetId
  amountCollateral: bigint
  amountSynthetic: bigint
  aIsBuyingSynthetic: boolean
}

export interface AcceptedData {
  starkKeyB: StarkKey
  positionIdB: bigint
  nonce: bigint
  submissionExpirationTime: number
  premiumCost: boolean
}
