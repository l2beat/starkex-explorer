import { PedersenHash, Timestamp } from '@explorer/types'

import { ForcedTransaction } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface HomeProps {
  stateUpdates: HomeStateUpdate[]
  forcedTransactions: ForcedTransaction[]
  totalUpdates: bigint
  totalPositions: bigint
}

export interface HomeStateUpdate {
  id: number
  hash: PedersenHash
  timestamp: Timestamp
  positionCount: number
}
