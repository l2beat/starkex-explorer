import { Interface } from '@ethersproject/abi'
import { AssetHash, StarkKey } from '@explorer/types'

const coder = new Interface([
  'function withdrawWithTokenId(uint256 ownerKey, uint256 assetType, uint256 tokenId)',
])

export interface WithdrawalWithTokenIdRequest {
  starkKey: StarkKey
  assetTypeHash: AssetHash
  tokenId: bigint
}

export function encodeWithdrawalWithTokenId(
  data: WithdrawalWithTokenIdRequest
) {
  return coder.encodeFunctionData('withdrawWithTokenId', [
    data.starkKey.toString(),
    data.assetTypeHash,
    data.tokenId,
  ])
}

export function decodeWithdrawalWithTokenId(
  data: string
): WithdrawalWithTokenIdRequest | undefined {
  try {
    const decoded = coder.decodeFunctionData('withdrawWithTokenId', data)

    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.ownerKey),
      assetTypeHash: AssetHash(decoded.assetType.toHexString()),
      tokenId: BigInt(decoded.tokenId),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}
