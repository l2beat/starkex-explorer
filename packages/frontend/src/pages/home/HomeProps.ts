import { EthereumAddress, PedersenHash, Timestamp } from '@explorer/types'

import { ForcedTransaction } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface HomeProps {
  readonly account: EthereumAddress | undefined
  readonly stateUpdates: ReadonlyArray<{
    readonly id: number
    readonly hash: PedersenHash
    readonly timestamp: Timestamp
    readonly positionCount: number
  }>
  readonly forcedTransactions: ReadonlyArray<ForcedTransaction>
  readonly totalUpdates: bigint
  readonly totalPositions: bigint
}
