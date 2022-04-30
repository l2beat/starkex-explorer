import { EthereumAddress } from '@explorer/types'

import { ForcedTransactionEntry } from '../forced-transactions/ForcedTransactionsIndexProps'
import { StateUpdateEntry } from '../state-updates/StateUpdatesIndexProps'

export interface HomeProps {
  readonly account: EthereumAddress | undefined
  readonly stateUpdates: readonly StateUpdateEntry[]
  readonly forcedTransactions: readonly ForcedTransactionEntry[]
  readonly totalUpdates: bigint
  readonly totalPositions: bigint
}
