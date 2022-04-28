import { EthereumAddress, Hash256, Timestamp } from '@explorer/types'

interface Exit {
  readonly transactionHash: Hash256
  readonly positionId: bigint
  readonly ethereumAddress?: EthereumAddress
  readonly value: bigint
  readonly stateUpdateId?: number
}

type ForcedTransaction = Exit // TODO: | Buy | Sell

export type HistoryEvent = (
  | {
      type: 'sent'
    }
  | {
      type: 'mined'
    }
  | {
      type: 'verified'
      stateUpdateId: number
    }
) & { timestamp: Timestamp }

export type ForcedTransactionDetailsProps = ForcedTransaction & {
  readonly account: EthereumAddress | undefined
  readonly history: ReadonlyArray<HistoryEvent>
}
