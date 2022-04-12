import { AssetId, Timestamp } from '@explorer/types'
import { createHash } from 'crypto'

type TransactionEventRow = {
  id: number
  transaction_hash: string
  transaction_type: 'withdrawal' | 'trade'
  event_type: 'mined' | 'verified'
  block_number?: number
  timestamp: bigint
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

type EventRecord = {
  id: number
  transactionHash: string
  timestamp: Timestamp
}

type VerifiedEvent = {
  eventType: 'verified'
  stateUpdateId: number
}

type MinedWithdrawalEvent = EventRecord & {
  transactionType: 'withdrawal'
  eventType: 'mined'
  blockNumber: number
  publicKey: string
  positionId: bigint
  amount: bigint
}

type VerifiedWithdrawalEvent = EventRecord &
  VerifiedEvent & {
    transactionType: 'withdrawal'
    blockNumber: number
  }

type WithdrawalEvent = MinedWithdrawalEvent | VerifiedWithdrawalEvent

type MinedTradeEvent = EventRecord & {
  transactionType: 'trade'
  eventType: 'mined'
  blockNumber: number
  publicKeyA: string
  publicKeyB: string
  positionIdA: bigint
  positionIdB: bigint
  syntheticAssetId: AssetId
  isABuyingSynthetic: boolean
  collateralAmount: bigint
  syntheticAmount: bigint
}

type VerifiedTradeEvent = EventRecord &
  VerifiedEvent & {
    transactionType: 'trade'
    blockNumber: number
  }

type TradeEvent = MinedTradeEvent | VerifiedTradeEvent

type TransactionEventRecord = WithdrawalEvent | TradeEvent

export type TransactionEventRecordCandidate = Omit<TransactionEventRecord, 'id'>

type TradeData = Pick<
  MinedTradeEvent,
  | 'publicKeyA'
  | 'publicKeyB'
  | 'positionIdA'
  | 'positionIdB'
  | 'syntheticAssetId'
  | 'syntheticAmount'
  | 'collateralAmount'
  | 'isABuyingSynthetic'
>
type WithdrawalData = Pick<
  MinedWithdrawalEvent,
  'amount' | 'publicKey' | 'positionId'
>

function hashData(data: TradeData | WithdrawalData): string {
  const serializable = Object.entries(data).reduce((acc, [key, val]) => {
    return {
      ...acc,
      [key]: typeof val === 'bigint' ? val.toString() : val,
    }
  }, {})
  return createHash('md5').update(JSON.stringify(serializable)).digest('base64')
}

export class ForcedTransactionsRepository {
  private events: TransactionEventRow[]
  private id: number

  constructor() {
    this.events = []
    this.id = 0
  }

  async addEvents(events: TransactionEventRecordCandidate[]): Promise<void> {
    events
      .map((event) => {
        const {
          transactionHash: transaction_hash,
          transactionType: transaction_type,
          eventType: event_type,
          blockNumber: block_number,
          timestamp,
          ...rest
        } = event

        const data: TransactionEventRow['data'] = rest

        if (event_type === 'mined') {
          data.hash = hashData(data as TradeData | WithdrawalData)
        }

        return {
          id: this.id++,
          transaction_hash,
          transaction_type,
          event_type,
          block_number,
          timestamp: BigInt(Number(timestamp)),
          data,
        }
      })
      .forEach((e) => this.events.push(e))
  }

  async getTransactionHashesByMinedEventsData(
    datas: (TradeData | WithdrawalData)[]
  ): Promise<{ dataHash: string; transactionHash: string }[]> {
    const hashes = datas.map(hashData)

    return this.events
      .filter(
        (e) =>
          e.event_type === 'mined' &&
          e.data.hash &&
          hashes.includes(e.data.hash)
      )
      .map((e) => ({
        dataHash: String(e.data.hash),
        transactionHash: e.transaction_hash,
      }))
  }

  async discardAfter(blockNumber: number): Promise<void> {
    this.events = this.events.filter((e) =>
      e.block_number ? e.block_number < blockNumber : true
    )
  }
}
