import { AccountDetails } from '../common/AccountDetails'
import { ForcedTransactionEntry } from '../forced-transactions/ForcedTransactionsIndexProps'
import { ForcedTradeOfferEntry } from '../offers/ForcedTradeOffersIndexProps'
import { StateUpdateEntry } from '../state-updates/StateUpdatesIndexProps'

export interface HomeProps {
  readonly account: AccountDetails | undefined
  readonly stateUpdates: readonly StateUpdateEntry[]
  readonly forcedTransactions: readonly ForcedTransactionEntry[]
  readonly forcedTradeOffers: readonly ForcedTradeOfferEntry[]
  readonly totalUpdates: bigint
  readonly totalPositions: bigint
}
