import { AssetId, EthereumAddress } from '@explorer/types'

import { ForcedTransactionEntry } from '../forced-transactions/ForcedTransactionsIndexProps'
import { StateUpdateEntry } from '../state-updates/StateUpdatesIndexProps'

export interface ForcedTradeOfferEntry {
  id: number
  type: 'buy' | 'sell'
  assetId: AssetId
  price: bigint
  amount: bigint
  total: bigint
  positionId: bigint
}

export interface HomeProps {
  readonly account: EthereumAddress | undefined
  readonly stateUpdates: readonly StateUpdateEntry[]
  readonly forcedTransactions: readonly ForcedTransactionEntry[]
  readonly forcedTradeOffers: readonly ForcedTradeOfferEntry[]
  readonly totalUpdates: bigint
  readonly totalPositions: bigint
}
