import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'

export interface ForcedTradeOfferEntry {
  readonly id: number
  readonly createdAt: Timestamp
  readonly type: 'buy' | 'sell'
  readonly assetId: AssetId
  readonly price: bigint
  readonly amount: bigint
  readonly total: bigint
  readonly positionId: bigint
}

export interface ForcedTradeOffersIndexProps {
  readonly account: EthereumAddress | undefined
  readonly offers: ForcedTradeOfferEntry[]
  readonly params: {
    readonly perPage: number
    readonly page: number
  }
  readonly total: number
}
