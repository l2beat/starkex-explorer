import { AssetId, Hash256, Timestamp } from '@explorer/types'

export interface ForcedTransactionsIndexProps {
  transactions: ForcedTransaction[]
  params: {
    perPage: number
    page: number
  }
  fullCount: bigint
}

export interface ForcedTransaction {
  type: 'exit' | 'buy' | 'sell'
  status: 'waiting to be included' | 'completed'
  hash: Hash256
  lastUpdate: Timestamp
  amount: bigint
  assetId: AssetId
  positionId: bigint
}
