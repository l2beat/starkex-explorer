import { AssetId, Timestamp } from '@explorer/types'
import { createHash } from 'crypto'

import { JsonB } from './types'

type TransactionType = 'withdrawal' | 'trade'

type EventType = 'mined' | 'verified'

type TransactionEventRow = {
  id: number
  transaction_hash: string
  transaction_type: TransactionType
  event_type: EventType
  block_number?: number
  timestamp: bigint
  data: JsonB<string>
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

type MinedWithdrawalEventData = {
  publicKey: string
  positionId: bigint
  amount: bigint
}

type MinedWithdrawalEvent = EventRecord &
  MinedWithdrawalEventData & {
    transactionType: 'withdrawal'
    eventType: 'mined'
    blockNumber: number
  }

type VerifiedWithdrawalEvent = EventRecord &
  VerifiedEvent & {
    transactionType: 'withdrawal'
    blockNumber: number
  }

type WithdrawalEvent = MinedWithdrawalEvent | VerifiedWithdrawalEvent

type MinedTradeEventData = {
  publicKeyA: string
  publicKeyB: string
  positionIdA: bigint
  positionIdB: bigint
  syntheticAssetId: AssetId
  isABuyingSynthetic: boolean
  collateralAmount: bigint
  syntheticAmount: bigint
}

type MinedTradeEvent = EventRecord &
  MinedTradeEventData & {
    transactionType: 'trade'
    eventType: 'mined'
    blockNumber: number
  }

type VerifiedTradeEvent = EventRecord &
  VerifiedEvent & {
    transactionType: 'trade'
    blockNumber: number
  }

type TradeEvent = MinedTradeEvent | VerifiedTradeEvent

type TransactionEventRecord = WithdrawalEvent | TradeEvent

export type TransactionEventRecordCandidate = Omit<TransactionEventRecord, 'id'>

function toJsonString(data: object) {
  const serializable = Object.entries(data).reduce((acc, [key, val]) => {
    return {
      ...acc,
      [key]: typeof val === 'bigint' ? val.toString() : val,
    }
  }, {})
  return JSON.stringify(serializable)
}

function fromJsonString(data: string) {
  return JSON.parse(data)
}

function hashData(data: string): string {
  return createHash('md5').update(data).digest('base64')
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

        let data: string

        if (event_type === 'mined') {
          const hash = hashData(toJsonString(rest))
          data = toJsonString({ ...rest, hash })
        } else {
          data = toJsonString(rest)
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
    datas: (MinedTradeEventData | MinedWithdrawalEventData)[]
  ): Promise<{ dataHash: string; transactionHash: string }[]> {
    const hashes = datas.map(toJsonString).map(hashData)

    return this.events
      .map((e) => {
        return {
          ...e,
          data: fromJsonString(e.data),
        }
      })
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
