import { AssetDetails, CollateralAsset, stringAs } from '@explorer/shared'
import { AssetHash, AssetId } from '@explorer/types'
import { z } from 'zod'

export type Asset = z.infer<typeof Asset>
export const Asset = z.object({
  hashOrId: z.union([stringAs(AssetId), stringAs(AssetHash)]),
  details: AssetDetails.optional(),
})

export interface AssetInfo {
  name: string
  symbol: string
  isUnknownHash?: boolean
  imageUrl: string
}

export function assetToInfo(
  asset: Asset,
  collateralAsset?: CollateralAsset
): AssetInfo {
  //There is the case where the collateral asset is represented by a hash
  //I.e. in LogWithdrawalAllowed
  const hashOrId =
    asset.details && asset.details.assetHash === collateralAsset?.assetHash
      ? collateralAsset.assetId
      : asset.hashOrId
  return AssetId.check(hashOrId)
    ? assetIdToInfo(hashOrId)
    : assetHashToInfo(hashOrId, asset.details)
}

function assetIdToInfo(assetId: AssetId): AssetInfo {
  const symbol = assetId.split('-')[0] ?? ''
  const assetInfo = perpetualsInfo[symbol]

  if (!assetInfo) {
    return {
      name: symbol,
      symbol,
      imageUrl: '/images/unknown-asset.svg',
    }
  }

  return {
    ...assetInfo,
    imageUrl: getDydxImageUrl(assetInfo.symbol),
  }
}

function assetHashToInfo(
  assetHash: AssetHash,
  assetDetails?: AssetDetails
): AssetInfo {
  if (!assetDetails) {
    if (assetHash.startsWith('0x04')) {
      return {
        name: 'Mintable NFT',
        symbol: `Mint # ${assetHash.substring(4)}`,
        isUnknownHash: true,
        imageUrl: '/images/unknown-asset.svg',
      }
    }
    return {
      name: 'Unknown',
      symbol: assetHash.toString(),
      isUnknownHash: true,
      imageUrl: '/images/unknown-asset.svg',
    }
  }
  if (assetDetails.type === 'ETH') {
    //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ethInfo = perpetualsInfo.ETH!
    return {
      ...ethInfo,
      imageUrl: getDydxImageUrl(ethInfo.symbol),
    }
  }
  return {
    name: assetDetails.name ?? assetDetails.symbol ?? 'Unknown',
    symbol: assetDetails.symbol ?? assetDetails.name ?? assetHash.toString(),
    isUnknownHash: !assetDetails.symbol && !assetDetails.name,
    imageUrl: getTrustWalletImageUrl(assetDetails.address.toString()),
  }
}

function getTrustWalletImageUrl(address: string) {
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`
}

function getDydxImageUrl(symbol: string) {
  return `https://trade.dydx.exchange/currencies/${symbol.toLowerCase()}.svg`
}

const perpetualsInfo: Record<string, Omit<AssetInfo, 'imageUrl'>> = {
  ETH: { name: 'Ethereum', symbol: 'ETH' },
  USDC: { name: 'USD Coin', symbol: 'USDC' },
  BTC: { name: 'Bitcoin', symbol: 'BTC' },
  ADA: { name: 'Cardano', symbol: 'ADA' },
  BCH: { name: 'Bitcoin Cash', symbol: 'BCH' },
  DOGE: { name: 'Dogecoin', symbol: 'DOGE' },
  DOT: { name: 'Polkadot', symbol: 'DOT' },
  LTC: { name: 'Litecoin', symbol: 'LTC' },
  LINK: { name: 'Chainlink', symbol: 'LINK' },
  UNI: { name: 'Uniswap', symbol: 'UNI' },
  SOL: { name: 'Solana', symbol: 'SOL' },
  MATIC: { name: 'Polygon', symbol: 'MATIC' },
  XMR: { name: 'Monero', symbol: 'XMR' },
  EOS: { name: 'EOS', symbol: 'EOS' },
  AAVE: { name: 'Aave', symbol: 'AAVE' },
  ATOM: { name: 'Cosmos', symbol: 'ATOM' },
  MKR: { name: 'Maker', symbol: 'MKR' },
  COMP: { name: 'Compound', symbol: 'COMP' },
  AVAX: { name: 'Avalanche', symbol: 'AVAX' },
  SNX: { name: 'Synthetix', symbol: 'SNX' },
  SUSHI: { name: 'Sushi', symbol: 'SUSHI' },
  YFI: { name: 'Yearn', symbol: 'YFI' },
  UMA: { name: 'UMA', symbol: 'UMA' },
  CRV: { name: 'Curve', symbol: 'CRV' },
  '1INCH': { name: '1inch', symbol: '1INCH' },
  ZEC: { name: 'Zcash', symbol: 'ZEC' },
  ALGO: { name: 'Algorand', symbol: 'ALGO' },
  ZRX: { name: '0x', symbol: 'ZRX' },
  ENJ: { name: 'Enjin', symbol: 'ENJ' },
  XLM: { name: 'Stellar', symbol: 'XLM' },
  ETC: { name: 'Ethereum Classic', symbol: 'ETC' },
  NEAR: { name: 'Near', symbol: 'NEAR' },
  RUNE: { name: 'Rune', symbol: 'RUNE' },
  CELO: { name: 'Celo', symbol: 'CELO' },
  ICP: { name: 'Internet Computer', symbol: 'ICP' },
  TRX: { name: 'Tron', symbol: 'TRX' },
  XTZ: { name: 'Tezos', symbol: 'XTZ' },
}
