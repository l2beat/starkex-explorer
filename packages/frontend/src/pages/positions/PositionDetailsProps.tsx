import { AssetId, Timestamp } from '@explorer/types'
import { ForcedTransaction } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface PositionDetailsProps {
  readonly positionId: bigint
  readonly publicKey: string
  readonly ethAddress?: string
  readonly stateUpdateId: number
  readonly lastUpdateTimestamp: Timestamp
  readonly assets: ReadonlyArray<{
    readonly assetId: AssetId
    readonly balance: bigint
    readonly totalUSDCents: bigint
    readonly price?: bigint
  }>
  readonly history: ReadonlyArray<{
    readonly stateUpdateId: number
    readonly totalUSDCents: bigint
    readonly assetsUpdated: number
  }>
  readonly transactions: ReadonlyArray<Omit<ForcedTransaction, 'positionId'>>
}
