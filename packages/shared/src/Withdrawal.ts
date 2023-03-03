import { Interface } from '@ethersproject/abi'
import { StarkKey } from '@explorer/types'

import { AssetType } from './AssetDetails'
import { getAssetSelector } from './utils/getAssetSelector'

const coder = new Interface([
  'function withdraw(uint256 ownerKey, uint256 assetType)',
])

export function encodeWithdrawal(
  starkKey: StarkKey,
  assetType: Extract<AssetType, 'ETH' | 'ERC20'>
) {
  const assetTypeSelector = getAssetSelector(assetType)

  return coder.encodeFunctionData('withdraw', [
    starkKey.toString(),
    assetTypeSelector,
  ])
}

export function decodeWithdrawal(data: string) {
  try {
    const decoded = coder.decodeFunctionData('withdraw', data)

    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.ownerKey),
      assetType: decoded.assetType.toHexString() as string,
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}
