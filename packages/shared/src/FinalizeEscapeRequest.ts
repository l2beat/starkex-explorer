import { Interface } from '@ethersproject/abi'
import { AssetHash, StarkKey } from '@explorer/types'

const finalizePerpetualEscapeRequestCoder = new Interface([
  'function escape(uint256 starkKey, uint256 vaultId, uint256 quantizedAmount)',
])
const finalizeSpotEscapeRequestCoder = new Interface([
  'function escape(uint256 starkKey, uint256 vaultId, uint256 assetId, uint256 quantizedAmount)',
])

export interface FinalizePerpetualEscapeRequest {
  starkKey: StarkKey
  positionId: bigint
  quantizedAmount: bigint
}

export function encodeFinalizePerpetualEscapeRequest(
  data: FinalizePerpetualEscapeRequest
) {
  return finalizePerpetualEscapeRequestCoder.encodeFunctionData('escape', [
    data.starkKey.toString(),
    data.positionId,
    data.quantizedAmount,
  ])
}

export function decodeFinalizePerpetualEscapeRequest(
  data: string
): FinalizePerpetualEscapeRequest | undefined {
  try {
    const decoded = finalizePerpetualEscapeRequestCoder.decodeFunctionData(
      'escape',
      data
    )
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.starkKey),
      positionId: BigInt(decoded.vaultId),
      quantizedAmount: BigInt(decoded.quantizedAmount),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}

export interface FinalizeSpotEscapeRequest {
  starkKey: StarkKey
  vaultId: bigint
  assetId: AssetHash
  quantizedAmount: bigint
}

export function encodeFinalizeSpotEscapeRequest(
  data: FinalizeSpotEscapeRequest
) {
  return finalizeSpotEscapeRequestCoder.encodeFunctionData('escape', [
    data.starkKey.toString(),
    data.vaultId,
    data.assetId,
    data.quantizedAmount,
  ])
}

export function decodeFinalizeSpotEscapeRequest(
  data: string
): FinalizeSpotEscapeRequest | undefined {
  try {
    const decoded = finalizeSpotEscapeRequestCoder.decodeFunctionData(
      'escape',
      data
    )

    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.starkKey),
      vaultId: BigInt(decoded.vaultId),
      assetId: AssetHash.from(decoded.assetId),
      quantizedAmount: BigInt(decoded.quantizedAmount),
    }
  } catch {
    return
  }
}
