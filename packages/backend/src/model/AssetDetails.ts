import { EthereumAddress, AssetHash, Hash256 } from '@explorer/types'

export type AssetDetails =
  | ETHDetails
  | ERC20Details
  | ERC721Details
  | ERC1155Details
  | MintableERC721Details
  | MintableERC20Details

export type AssetType = AssetDetails['type']

export interface ETHDetails {
  assetHash: AssetHash
  assetTypeHash: Hash256
  type: 'ETH'
  quantum: bigint
}

export interface ERC20Details {
  assetHash: AssetHash
  assetTypeHash: Hash256
  type: 'ERC20'
  quantum: bigint
  address: EthereumAddress

  name?: string
  symbol?: string
  decimals?: number
}

export interface ERC721Details {
  assetHash: AssetHash
  assetTypeHash: Hash256
  type: 'ERC721'
  quantum: bigint
  tokenId: bigint
  address: EthereumAddress

  name?: string
  symbol?: string
  uri?: string
}

export interface ERC1155Details {
  assetHash: AssetHash
  assetTypeHash: Hash256
  type: 'ERC1155'
  quantum: bigint
  tokenId: bigint
  address: EthereumAddress

  name?: string
  symbol?: string
  decimals?: number
  uri?: string
}

export interface MintableERC721Details {
  assetHash: AssetHash
  assetTypeHash: Hash256
  type: 'MINTABLE_ERC721'
  quantum: bigint
  mintingBlob: string
  address: EthereumAddress

  tokenId?: bigint
  name?: string
  symbol?: string
  uri?: string
}

export interface MintableERC20Details {
  assetHash: AssetHash
  assetTypeHash: Hash256
  type: 'MINTABLE_ERC20'
  quantum: bigint
  mintingBlob: string
  address: EthereumAddress

  name?: string
  symbol?: string
  decimals?: number
}
