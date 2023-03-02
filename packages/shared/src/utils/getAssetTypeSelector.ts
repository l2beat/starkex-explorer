import { keccak256 } from '@ethersproject/solidity'

import { AssetType } from '../AssetDetails'
import { assertUnreachable } from './assert'

export function getAssetTypeSelector(
  assetType:
    | Extract<AssetType, 'ETH' | 'ERC20'>
    | Extract<AssetType, 'ERC721' | 'ERC1155'>
) {
  // These signatures are taken from the Starkware contracts
  // https://github.com/starkware-libs/starkex-contracts/blob/75c3a2a8dfff70604d851fc6b1a2bc8bc1a3964b/scalable-dex/contracts/src/interactions/TokenAssetData.sol#L10
  switch (assetType) {
    case 'ETH':
      return bytes4Keccak256('ETH()')
    case 'ERC20':
      return bytes4Keccak256('ERC20Token(address)')
    case 'ERC721':
      return bytes4Keccak256('ERC721Token(address,uint256)')
    case 'ERC1155':
      return bytes4Keccak256('ERC1155Token(address,uint256)')
    default:
      assertUnreachable(assetType)
  }
}

export function bytes4Keccak256(value: string) {
  return keccak256(['string'], [value]).slice(0, 10)
}
