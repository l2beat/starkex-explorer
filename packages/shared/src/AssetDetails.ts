import { AssetHash, EthereumAddress, Hash256 } from '@explorer/types'
import { z } from 'zod'

import { stringAs, stringAsBigInt } from './types'

export const ETHDetails = z.object({
  assetHash: stringAs(AssetHash),
  assetTypeHash: stringAs(Hash256),
  type: z.literal('ETH'),
  quantum: stringAsBigInt(),
  name: z.literal('Ethereum'),
  symbol: z.literal('ETH'),
  contractError: z.array(z.unknown()),
})
export type ETHDetails = z.infer<typeof ETHDetails>

export type ERC20Details = z.infer<typeof ERC20Details>
export const ERC20Details = z.object({
  assetHash: stringAs(AssetHash),
  assetTypeHash: stringAs(Hash256),
  type: z.literal('ERC20'),
  quantum: stringAsBigInt(),
  contractError: z.array(z.unknown()),
  address: stringAs(EthereumAddress),
  name: z.string().optional(),
  symbol: z.string().optional(),
  decimals: z.number().optional(),
})

export type ERC721Details = z.infer<typeof ERC721Details>
export const ERC721Details = z.object({
  assetHash: stringAs(AssetHash),
  assetTypeHash: stringAs(Hash256),
  type: z.literal('ERC721'),
  quantum: stringAsBigInt(),
  contractError: z.array(z.unknown()),
  tokenId: stringAsBigInt(),
  address: stringAs(EthereumAddress),
  name: z.string().optional(),
  symbol: z.string().optional(),
  uri: z.string().optional(),
})

export type ERC1155Details = z.infer<typeof ERC1155Details>
export const ERC1155Details = z.object({
  assetHash: stringAs(AssetHash),
  assetTypeHash: stringAs(Hash256),
  type: z.literal('ERC1155'),
  quantum: stringAsBigInt(),
  contractError: z.array(z.unknown()),
  tokenId: stringAsBigInt(),
  address: stringAs(EthereumAddress),
  name: z.string().optional(),
  symbol: z.string().optional(),
  decimals: z.number().optional(),
  uri: z.string().optional(),
})

export type MintableERC721Details = z.infer<typeof MintableERC721Details>
export const MintableERC721Details = z.object({
  assetHash: stringAs(AssetHash),
  assetTypeHash: stringAs(Hash256),
  type: z.literal('MINTABLE_ERC721'),
  quantum: stringAsBigInt(),
  contractError: z.array(z.unknown()),
  mintingBlob: z.string(),
  address: stringAs(EthereumAddress),
  name: z.string().optional(),
  symbol: z.string().optional(),
  uri: z.string().optional(),
})

export type MintableERC20Details = z.infer<typeof MintableERC20Details>
export const MintableERC20Details = z.object({
  assetHash: stringAs(AssetHash),
  assetTypeHash: stringAs(Hash256),
  type: z.literal('MINTABLE_ERC20'),
  quantum: stringAsBigInt(),
  contractError: z.array(z.unknown()),
  mintingBlob: z.string(),
  address: stringAs(EthereumAddress),
  name: z.string().optional(),
  symbol: z.string().optional(),
  decimals: z.number().optional(), //TODO: Figure out if it's possible for MINTABLE_ERC20 to have decimals
})

export type AssetDetails = z.infer<typeof AssetDetails>
export const AssetDetails = z.union([
  ETHDetails,
  ERC20Details,
  ERC721Details,
  ERC1155Details,
  MintableERC721Details,
  MintableERC20Details,
])

export type AssetType = AssetDetails['type']
