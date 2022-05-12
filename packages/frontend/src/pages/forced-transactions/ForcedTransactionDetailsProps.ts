import { EthereumAddress, Hash256, Timestamp } from '@explorer/types'

export type ForcedTransaction = ForcedExitTransaction // TODO: | Buy | Sell

export interface ForcedExitTransaction {
  readonly transactionHash: Hash256
  readonly positionId: bigint
  readonly ethereumAddress?: EthereumAddress
  readonly value: bigint
  readonly stateUpdateId?: number
}

export type TransactionStatusEntry =
  | TransactionSentEntry
  | TransactionMinedEntry
  | TransactionVerifiedEntry
  | TransactionRevertedEntry

export interface TransactionSentEntry {
  readonly type: 'sent'
  readonly timestamp: Timestamp
}

export interface TransactionMinedEntry {
  readonly type: 'mined'
  readonly timestamp: Timestamp
}

export interface TransactionVerifiedEntry {
  readonly type: 'verified'
  readonly stateUpdateId: number
  readonly timestamp: Timestamp
}

export interface TransactionRevertedEntry {
  readonly type: 'reverted'
  readonly timestamp: Timestamp
}

export interface ForcedTransactionDetailsProps extends ForcedTransaction {
  readonly account: EthereumAddress | undefined
  readonly history: readonly TransactionStatusEntry[]
}
