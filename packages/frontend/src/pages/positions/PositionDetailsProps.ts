import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'

import { ForcedTransactionEntry } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface PositionDetailsProps {
  readonly account: EthereumAddress | undefined
  readonly positionId: bigint
  readonly publicKey: string
  readonly ethAddress?: string
  readonly stateUpdateId: number
  readonly lastUpdateTimestamp: Timestamp
  readonly assets: readonly PositionAssetEntry[]
  readonly history: readonly PositionHistoryEntry[]
  readonly transactions: readonly ForcedTransactionEntry[]
}

export interface PositionAssetEntry {
  readonly assetId: AssetId
  readonly balance: bigint
  readonly totalUSDCents: bigint
  readonly price?: bigint
}

export interface PositionHistoryEntry {
  readonly stateUpdateId: number
  readonly totalUSDCents: bigint
  readonly assetsUpdated: number
}
