import { Interface } from '@ethersproject/abi'
import { encodeAssetId } from '@explorer/encoding'
import { AssetId, StarkKey } from '@explorer/types'

const coder = new Interface([
  'function withdraw(uint256 starkKey, uint256 assetType)',
])

export function encodeFinalizeExitRequest(starkKey: StarkKey) {
  return coder.encodeFunctionData('withdraw', [
    starkKey.toString(),
    `0x${encodeAssetId(AssetId.USDC)}`,
  ])
}

export function decodeFinalizeExitRequest(data: string) {
  try {
    const decoded = coder.decodeFunctionData('withdraw', data)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return {
      starkKey: StarkKey.from(decoded.starkKey),
      assetType: decoded.assetType.toHexString(),
    }
  } catch {
    return
  }
}
