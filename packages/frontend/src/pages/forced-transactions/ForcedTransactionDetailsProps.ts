import { AssetId, EthereumAddress, Hash256, StarkKey } from '@explorer/types'

import { AccountDetails } from '../common/AccountDetails'
import { ForcedHistoryEvent } from '../common/ForcedHistory'
import { FinalizeExitFormData } from './finalize-form'
import { TransactionStatus } from './ForcedTransactionsIndexProps'

export type ForcedTransaction = ForcedExit | ForcedBuy | ForcedSell

export interface ForcedTradeData {
  readonly positionIdA: bigint
  readonly addressA?: EthereumAddress
  readonly syntheticAmount: bigint
  readonly collateralAmount: bigint
  readonly syntheticAssetId: AssetId
  readonly positionIdB: bigint
  readonly addressB?: EthereumAddress
  readonly transactionHash: Hash256
  readonly stateUpdateId?: number
}

export interface ForcedSell {
  readonly type: 'sell'
  readonly data: ForcedTradeData
}

export interface ForcedBuy {
  readonly type: 'buy'
  readonly data: ForcedTradeData
}

export interface ForcedExit {
  readonly type: 'exit'
  readonly data: {
    readonly transactionHash: Hash256
    readonly positionId: bigint
    readonly ethereumAddress?: EthereumAddress
    readonly starkKey: StarkKey
    readonly value: bigint
    readonly stateUpdateId?: number
    readonly status: TransactionStatus
    readonly finalizeHash?: Hash256
  }
  readonly finalizeForm?: FinalizeExitFormData
}

export interface ForcedTransactionDetailsProps {
  readonly account: AccountDetails | undefined
  readonly transaction: ForcedTransaction
  readonly history: ForcedHistoryEvent[]
}
