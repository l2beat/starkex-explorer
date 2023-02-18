import { AssetHash, AssetId, EthereumAddress, Hash256 } from '@explorer/types'

import { Asset } from '../../utils/assetUtils'
import { Bucket } from './bucket'

export const assetBucket = new Bucket<Asset>()
assetBucket.add({ hashOrId: AssetId.USDC })
assetBucket.add({ hashOrId: AssetId('ETH-9') })
assetBucket.add({ hashOrId: AssetId('BTC-10') })
assetBucket.add({ hashOrId: AssetHash.fake() })
assetBucket.add({
  hashOrId: AssetHash.fake(),
  details: {
    assetHash: AssetHash.fake(),
    assetTypeHash: Hash256.fake(),
    address: EthereumAddress('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'),
    type: 'ERC20',
    name: 'Uniswap',
    symbol: 'UNI',
    quantum: 10n ** 9n,
    decimals: 18,
    contractError: [],
  },
})
assetBucket.add({
  hashOrId: AssetHash.fake(),
  details: {
    assetHash: AssetHash.fake(),
    assetTypeHash: Hash256.fake(),
    address: EthereumAddress('0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB'),
    type: 'ERC721',
    name: 'CRYPTOPUNKS',
    symbol: 'Ͼ',
    quantum: 1n,
    tokenId: 4431n,
    uri: undefined,
    contractError: [],
  },
})

export const amountBucket = new Bucket([
  32_000_000_000_000n,
  500_000_000n,
  7_123_456_789n,
  25_683_230_000_000n,
  94_521_020n,
])
