import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'

import { AccountDetails } from '../common/AccountDetails'
import { ForcedTransactionEntry } from '../forced-transactions/ForcedTransactionsIndexProps'
import { OfferType } from '../offers'

export interface PositionDetailsProps {
  readonly account: AccountDetails | undefined
  readonly positionId: bigint
  readonly starkKey: StarkKey
  readonly ethAddress?: EthereumAddress
  readonly stateUpdateId: number
  readonly lastUpdateTimestamp: Timestamp
  readonly ownedByYou: boolean
  readonly assets: readonly PositionAssetEntry[]
  readonly history: readonly PositionHistoryEntry[]
  readonly transactions: readonly ForcedTransactionEntry[]
  readonly offers: readonly OfferHistoryEntry[]
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

export interface OfferHistoryEntry {
  id: number
  type: OfferType
  role: 'maker' | 'taker'
  createdAt: Timestamp
  accepted?: {
    submissionExpirationTime: bigint
    transactionHash?: Hash256
  }
  cancelledAt?: Timestamp
  syntheticAssetId: AssetId
  syntheticAmount: bigint
  collateralAmount: bigint
}
