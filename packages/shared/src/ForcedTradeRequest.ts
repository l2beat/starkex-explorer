import { Interface } from '@ethersproject/abi'
import { decodeAssetId, encodeAssetId } from '@explorer/encoding'
import { AssetId, StarkKey } from '@explorer/types'

const coder = new Interface([
  `function forcedTradeRequest(
      uint256 starkKeyA,
      uint256 starkKeyB,
      uint256 vaultIdA,
      uint256 vaultIdB,
      uint256 collateralAssetId,
      uint256 syntheticAssetId,
      uint256 amountCollateral,
      uint256 amountSynthetic,
      bool aIsBuyingSynthetic,
      uint256 submissionExpirationTime,
      uint256 nonce,
      bytes calldata signature,
      bool premiumCost
    )`,
])

export interface ForcedTradeRequest {
  starkKeyA: StarkKey
  starkKeyB: StarkKey
  positionIdA: bigint
  positionIdB: bigint
  collateralAssetId: AssetId
  syntheticAssetId: AssetId
  amountCollateral: bigint
  amountSynthetic: bigint
  aIsBuyingSynthetic: boolean
  submissionExpirationTime: bigint
  nonce: bigint
  signature: string
  premiumCost: boolean
}

export function decodeForcedTradeRequest(
  data: string
): ForcedTradeRequest | undefined {
  try {
    const decoded = coder.decodeFunctionData('forcedTradeRequest', data)
    return {
      starkKeyA: StarkKey.from(decoded.starkKeyA),
      starkKeyB: StarkKey.from(decoded.starkKeyB),
      positionIdA: BigInt(decoded.vaultIdA),
      positionIdB: BigInt(decoded.vaultIdB),
      collateralAssetId: decodeAssetId(
        decoded.collateralAssetId.toHexString().slice(2)
      ),
      syntheticAssetId: decodeAssetId(
        decoded.syntheticAssetId.toHexString().slice(2)
      ),
      amountCollateral: BigInt(decoded.amountCollateral),
      amountSynthetic: BigInt(decoded.amountSynthetic),
      aIsBuyingSynthetic: Boolean(decoded.aIsBuyingSynthetic),
      submissionExpirationTime: BigInt(decoded.submissionExpirationTime),
      nonce: BigInt(decoded.nonce),
      signature: String(decoded.signature),
      premiumCost: Boolean(decoded.premiumCost),
    }
  } catch {
    return
  }
}

export function encodeForcedTradeRequest(
  data: Omit<ForcedTradeRequest, 'collateralAssetId'>
) {
  return coder.encodeFunctionData('forcedTradeRequest', [
    data.starkKeyA,
    data.starkKeyB,
    data.positionIdA,
    data.positionIdB,
    '0x' + encodeAssetId(AssetId.USDC),
    '0x' + encodeAssetId(data.syntheticAssetId),
    data.amountCollateral,
    data.amountSynthetic,
    data.aIsBuyingSynthetic,
    data.submissionExpirationTime,
    data.nonce,
    data.signature,
    data.premiumCost,
  ])
}
