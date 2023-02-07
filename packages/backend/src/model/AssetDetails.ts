import { AssetHash, EthereumAddress, Hash256 } from '@explorer/types'

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
  name: 'Ethereum'
  symbol: 'ETH'
  contractError: unknown[]
}

export interface ERC20Details {
  assetHash: AssetHash
  assetTypeHash: Hash256
  type: 'ERC20'
  quantum: bigint
  contractError: unknown[]
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
  contractError: unknown[]
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
  contractError: unknown[]
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
  contractError: unknown[]
  mintingBlob: string
  address: EthereumAddress

  name?: string
  symbol?: string
  uri?: string
}

export interface MintableERC20Details {
  assetHash: AssetHash
  assetTypeHash: Hash256
  type: 'MINTABLE_ERC20'
  quantum: bigint
  contractError: unknown[]
  mintingBlob: string
  address: EthereumAddress

  name?: string
  symbol?: string
  decimals?: number //TODO: Figure out if it's possible for MINTABLE_ERC20 to have decimals
}
