import { AssetId, Hash256, Timestamp } from '@explorer/types'

import { AccountDetails } from '../common/AccountDetails'

export interface ForcedTransactionsIndexProps {
  readonly account: AccountDetails | undefined
  readonly transactions: readonly ForcedTransactionEntry[]
  readonly params: {
    readonly perPage: number
    readonly page: number
  }
  readonly total: number
}

export interface ForcedTransactionEntry {
  readonly type: 'exit' | 'buy' | 'sell'
  readonly status: 'sent' | 'reverted' | 'waiting to be included' | 'completed'
  readonly hash: Hash256
  readonly lastUpdate: Timestamp
  readonly amount: bigint
  readonly assetId: AssetId
  readonly positionId: bigint
}
