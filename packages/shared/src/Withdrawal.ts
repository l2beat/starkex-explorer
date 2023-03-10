import { Interface } from '@ethersproject/abi'
import { Hash256, StarkKey } from '@explorer/types'

const coder = new Interface([
  'function withdraw(uint256 ownerKey, uint256 assetType)',
])

export function encodeWithdrawal(starkKey: StarkKey, assetTypeHash: Hash256) {
  return coder.encodeFunctionData('withdraw', [
    starkKey.toString(),
    assetTypeHash,
  ])
}

export function decodeWithdrawal(data: string) {
  try {
    const decoded = coder.decodeFunctionData('withdraw', data)

    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.ownerKey),
      assetTypeHash: Hash256(decoded.assetType.toHexString()),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}
