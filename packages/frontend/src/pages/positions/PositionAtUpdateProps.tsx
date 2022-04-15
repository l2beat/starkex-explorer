import { AssetId, Timestamp } from '@explorer/types'
import { ForcedTransaction } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface PositionAtUpdateProps {
  readonly stateUpdateId: number
  readonly positionId: bigint
  readonly lastUpdateTimestamp: Timestamp
  readonly previousPublicKey?: string
  readonly publicKey: string
  readonly assetChanges: ReadonlyArray<{
    readonly assetId: AssetId
    readonly previousBalance: bigint
    readonly currentBalance: bigint
    readonly balanceDiff: bigint
  }>
  readonly transactions: ReadonlyArray<
    Omit<ForcedTransaction, 'positionId' | 'status'>
  >
}
