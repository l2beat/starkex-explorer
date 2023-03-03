import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

import { AssetType } from './AssetDetails'
import { getAssetSelector } from './utils/getAssetSelector'

const coder = new Interface([
  'function withdrawWithTokenId(uint256 ownerKey, uint256 assetType, uint256 tokenId)',
])

export function encodeWithdrawalWithTokenId(
  starkKey: StarkKey,
  assetType: Extract<AssetType, 'ERC721' | 'ERC1155'>,
  tokenId: bigint
) {
  const assetTypeSelector = getAssetSelector(assetType)

  return coder.encodeFunctionData('withdrawWithTokenId', [
    starkKey.toString(),
    assetTypeSelector,
    tokenId,
  ])
}

export function decodeWithdrawalWithTokenId(data: string) {
  try {
    const decoded = coder.decodeFunctionData('withdrawWithTokenId', data)

    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.ownerKey),
      assetType: decoded.assetType.toHexString() as string,
      tokenId: BigInt(decoded.tokenId),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}
