import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'
import { ForcedTransaction } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface PositionAtUpdateProps {
  readonly account: EthereumAddress | undefined
  readonly stateUpdateId: number
  readonly positionId: bigint
  readonly lastUpdateTimestamp: Timestamp
  readonly previousPublicKey?: string
  readonly publicKey: string
  readonly assetChanges: readonly AssetChange[]
  readonly transactions: Omit<ForcedTransaction, 'positionId' | 'status'>[]
}

export interface AssetChange {
  readonly assetId: AssetId
  readonly previousBalance: bigint
  readonly currentBalance: bigint
  readonly balanceDiff: bigint
}
