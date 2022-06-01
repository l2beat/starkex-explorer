import { AssetId, EthereumAddress, StarkKey, Timestamp } from '@explorer/types'

import { AccountDetails } from '../common/AccountDetails'
import { ForcedTransactionEntry } from '../forced-transactions/ForcedTransactionsIndexProps'
import { PendingOffer } from './pending/offers'

export interface PositionDetailsProps {
  readonly account: AccountDetails | undefined
  readonly positionId: bigint
  readonly publicKey: StarkKey
  readonly ethAddress?: EthereumAddress
  readonly stateUpdateId: number
  readonly lastUpdateTimestamp: Timestamp
  readonly assets: readonly PositionAssetEntry[]
  readonly history: readonly PositionHistoryEntry[]
  readonly transactions: readonly ForcedTransactionEntry[]
  readonly pendingOffers: readonly PendingOffer[]
}

export interface PositionAssetEntry {
  readonly assetId: AssetId
  readonly balance: bigint
  readonly totalUSDCents: bigint
  readonly priceUSDCents: bigint
}

export interface PositionHistoryEntry {
  readonly stateUpdateId: number
  readonly totalUSDCents: bigint
  readonly assetsUpdated: number
}
