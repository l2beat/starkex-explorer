import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'

export interface ForcedTradeOfferEntry {
  id: number
  createdAt: Timestamp
  type: 'buy' | 'sell'
  assetId: AssetId
  price: bigint
  amount: bigint
  total: bigint
  positionId: bigint
}

export interface ForcedTradeOffersIndexProps {
  offers: readonly ForcedTradeOfferEntry[]
  account: EthereumAddress | undefined
}
