import { AssetDetails } from '@explorer/shared'
import { AssetHash, AssetId } from '@explorer/types'

export interface AssetInfo {
  name: string
  symbol: string
  isUnknownHash?: boolean
  imageUrl: string
}

const ETH_INFO: AssetInfo = {
  name: 'Ethereum',
  symbol: 'ETH',
  // using weth image
  imageUrl: toTrustWalletImageUrl('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
}

export function assetToInfo(
  asset: AssetId | AssetHash,
  assetDetails?: AssetDetails
): AssetInfo {
  return AssetId.check(asset)
    ? assetIdToInfo(asset)
    : assetHashToInfo(asset, assetDetails)
}

function assetIdToInfo(assetId: AssetId): AssetInfo {
  const symbol = assetId.split('-')[0] ?? ''
  switch (symbol) {
    case 'ETH':
      return ETH_INFO
    case 'USDC':
      return {
        name: 'USD Coin',
        symbol: 'USDC',
        imageUrl: toTrustWalletImageUrl(
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        ),
      }
    default:
      return {
        name: symbol,
        symbol,
        imageUrl: '/images/unknown-asset.svg',
      }
  }
}

function assetHashToInfo(
  assetHash: AssetHash,
  assetDetails?: AssetDetails
): AssetInfo {
  if (!assetDetails) {
    return {
      name: 'Unknown',
      symbol: assetHash.toString(),
      isUnknownHash: true,
      imageUrl: '/images/unknown-asset.svg',
    }
  }
  if (assetDetails.type === 'ETH') {
    return ETH_INFO
  }
  return {
    name: assetDetails.name ?? assetDetails.symbol ?? 'Unknown',
    symbol: assetDetails.symbol ?? assetDetails.name ?? assetHash.toString(),
    isUnknownHash: !assetDetails.symbol && !assetDetails.name,
    imageUrl: toTrustWalletImageUrl(assetDetails.address.toString()),
  }
}

function toTrustWalletImageUrl(address: string, blockchain = 'ethereum') {
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${blockchain}/assets/${address}/logo.png`
}
