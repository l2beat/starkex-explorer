import { Interface } from '@ethersproject/abi'
import { Hash256, StarkKey } from '@explorer/types'

const coder = new Interface([
  'function withdrawWithTokenId(uint256 ownerKey, uint256 assetType, uint256 tokenId)',
])

export function encodeWithdrawalWithTokenId(
  starkKey: StarkKey,
  assetTypeHash: Hash256,
  tokenId: bigint
) {
  return coder.encodeFunctionData('withdrawWithTokenId', [
    starkKey.toString(),
    assetTypeHash,
    tokenId,
  ])
}

export function decodeWithdrawalWithTokenId(data: string) {
  try {
    const decoded = coder.decodeFunctionData('withdrawWithTokenId', data)

    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.ownerKey),
      assetTypeHash: Hash256(decoded.assetType.toHexString()),
      tokenId: BigInt(decoded.tokenId),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}
