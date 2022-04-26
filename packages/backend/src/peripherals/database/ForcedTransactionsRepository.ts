import { AssetId, Hash256, json, Timestamp } from '@explorer/types'
import { createHash } from 'crypto'
import { Knex } from 'knex'
import { ForcedTransactionEventRow as EventRow } from 'knex/types/tables'
import { groupBy, pick } from 'lodash'

import { Logger } from '../../tools/Logger'

type EventRecordCandidateBase = {
  id?: number
  transactionHash: Hash256
  timestamp: Timestamp
}

type WithdrawalMinedEventData = {
  publicKey: string
  positionId: bigint
  amount: bigint
}

type WithdrawalMinedEventRecordCandidate = EventRecordCandidateBase &
  WithdrawalMinedEventData & {
    transactionType: 'withdrawal'
    eventType: 'mined'
    blockNumber: number
  }

type VerifiedEventBase = {
  eventType: 'verified'
  stateUpdateId: number
}

export type WithdrawalVerifiedEventRecordCandidate = EventRecordCandidateBase &
  VerifiedEventBase & {
    transactionType: 'withdrawal'
    blockNumber: number
  }

type TradeMinedEventData = {
  publicKeyA: string
  publicKeyB: string
  positionIdA: bigint
  positionIdB: bigint
  syntheticAssetId: AssetId
  isABuyingSynthetic: boolean
  collateralAmount: bigint
  syntheticAmount: bigint
  nonce: bigint
}

type TradeMinedEventRecordCandidate = EventRecordCandidateBase &
  TradeMinedEventData & {
    transactionType: 'trade'
    eventType: 'mined'
    blockNumber: number
  }

export type TradeVerifiedEventRecordCandidate = EventRecordCandidateBase &
  VerifiedEventBase & {
    transactionType: 'trade'
    blockNumber: number
  }

export type EventRecordCandidate =
  | TradeMinedEventRecordCandidate
  | TradeVerifiedEventRecordCandidate
  | WithdrawalMinedEventRecordCandidate
  | WithdrawalVerifiedEventRecordCandidate

type EventRecord = EventRecordCandidate & {
  id: EventRow['id']
}

type EventRowCandidate = Omit<EventRow, 'id'> & {
  id?: EventRow['id']
}

function toSerializableJson(data: object): json {
  return Object.entries(data).reduce((acc, [key, val]) => {
    return {
      ...acc,
      [key]: typeof val === 'bigint' ? val.toString() : val,
    }
  }, {})
}

function toJsonString(data: object) {
  return JSON.stringify(toSerializableJson(data))
}

function hashData(data: string): string {
  return createHash('md5').update(data).digest('base64')
}

function recordCandidateToRow(
  candidate: EventRecordCandidate
): EventRowCandidate {
  const {
    id,
    transactionHash,
    transactionType: transaction_type,
    eventType: event_type,
    blockNumber: block_number,
    timestamp,
    ...data
  } = candidate

  const data_hash = hashData(toJsonString(data))

  return {
    id,
    transaction_hash: transactionHash.toString(),
    transaction_type,
    event_type,
    block_number,
    timestamp: BigInt(Number(timestamp)),
    data: toSerializableJson(data),
    data_hash,
  }
}

function toRecord(row: EventRow): EventRecord {
  const {
    id,
    transaction_hash,
    transaction_type: transactionType,
    event_type: eventType,
  } = row
  const data = Object(row.data)
  const timestamp = Timestamp(row.timestamp)
  const transactionHash = Hash256(transaction_hash)

  if (transactionType === 'withdrawal' && eventType === 'mined') {
    return {
      id,
      transactionHash,
      transactionType: 'withdrawal',
      eventType: 'mined',
      timestamp,
      blockNumber: Number(row.block_number),
      publicKey: String(data.publicKey),
      positionId: BigInt(data.positionId),
      amount: BigInt(data.amount),
    }
  }
  if (row.transaction_type === 'trade' && row.event_type === 'mined') {
    return {
      id,
      transactionHash,
      transactionType: 'trade',
      eventType: 'mined',
      timestamp,
      blockNumber: Number(row.block_number),
      publicKeyA: String(data.publicKeyA),
      publicKeyB: String(data.publicKeyB),
      positionIdA: BigInt(data.positionIdA),
      positionIdB: BigInt(data.positionIdB),
      collateralAmount: BigInt(data.collateralAmount),
      syntheticAmount: BigInt(data.syntheticAmount),
      isABuyingSynthetic: Boolean(data.isABuyingSynthetic),
      syntheticAssetId: AssetId(data.syntheticAssetId),
      nonce: BigInt(data.nonce),
    }
  }
  if (transactionType === 'withdrawal' && eventType === 'verified') {
    return {
      id,
      transactionHash,
      transactionType: 'withdrawal',
      eventType: 'verified',
      timestamp,
      blockNumber: Number(row.block_number),
      stateUpdateId: Number(data.stateUpdateId),
    }
  }
  if (transactionType === 'trade' && eventType === 'verified') {
    return {
      id,
      transactionHash,
      transactionType: 'trade',
      eventType: 'verified',
      timestamp,
      blockNumber: Number(row.block_number),
      stateUpdateId: Number(data.stateUpdateId),
    }
  }
  throw new Error('Unknown event type')
}

type MinedWithdrawal = {
  hash: Hash256
  type: 'withdrawal'
  status: 'mined'
  lastUpdate: Timestamp
} & WithdrawalMinedEventData

type VerifiedWithdrawal = Omit<MinedWithdrawal, 'status'> & {
  status: 'verified'
  stateUpdateId: number
}

type Withdrawal = MinedWithdrawal | VerifiedWithdrawal

type MinedTrade = {
  hash: Hash256
  type: 'trade'
  status: 'mined'
  lastUpdate: Timestamp
} & Omit<TradeMinedEventData, 'nonce'>

type VerifiedTrade = Omit<MinedTrade, 'status'> & {
  status: 'verified'
  stateUpdateId: number
}

type Trade = MinedTrade | VerifiedTrade

export type ForcedTransaction = Withdrawal | Trade

function applyEvent(
  transaction: ForcedTransaction,
  event: EventRecord
): ForcedTransaction {
  if (event.transactionType === 'withdrawal' && event.eventType === 'mined') {
    return {
      type: 'withdrawal',
      status: 'mined',
      hash: event.transactionHash,
      lastUpdate: event.timestamp,
      ...pick(event, 'amount', 'positionId', 'publicKey'),
    }
  }
  if (
    transaction.type === 'withdrawal' &&
    event.transactionType === 'withdrawal' &&
    event.eventType === 'verified'
  ) {
    return {
      ...transaction,
      status: 'verified',
      stateUpdateId: event.stateUpdateId,
      lastUpdate: event.timestamp,
    }
  }
  if (event.transactionType === 'trade' && event.eventType === 'mined') {
    return {
      type: 'trade',
      status: 'mined',
      hash: event.transactionHash,
      ...pick(
        event,
        'collateralAmount',
        'publicKeyA',
        'publicKeyB',
        'positionIdA',
        'positionIdB',
        'syntheticAssetId',
        'isABuyingSynthetic',
        'collateralAmount',
        'syntheticAmount'
      ),
      lastUpdate: event.timestamp,
    }
  }
  if (
    transaction.type === 'trade' &&
    event.transactionType === 'trade' &&
    event.eventType === 'verified'
  ) {
    return {
      ...transaction,
      status: 'verified',
      stateUpdateId: event.stateUpdateId,
    }
  }
  throw new Error(
    'Unknown type combination: ' +
      transaction.toString() +
      ' ' +
      event.toString()
  )
}

function reduceEventsToTransaction(events: EventRecord[]): ForcedTransaction {
  const sorted = events.sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  )
  return sorted.reduce(applyEvent, {} as ForcedTransaction)
}

function eventRowsToTransactions(rows: EventRow[]): ForcedTransaction[] {
  const events = rows.map(toRecord)
  const eventsGroupedByTransactionHash = Object.values(
    groupBy(events, (e) => e.transactionHash)
  ).sort((a, b) => Number(b[0].timestamp) - Number(a[0].timestamp))

  return eventsGroupedByTransactionHash.map(reduceEventsToTransaction)
}

export class ForcedTransactionsRepository {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async addEvents(candidates: EventRecordCandidate[]): Promise<void> {
    if (candidates.length === 0) {
      return
    }
    const rowCandidates = candidates.map(recordCandidateToRow)
    await this.knex('forced_transaction_events').insert(rowCandidates)
    this.logger.debug({
      method: 'addEvents',
      count: candidates.length,
    })
  }

  async getTransactionHashesByMinedEventsData(
    datas: (TradeMinedEventData | WithdrawalMinedEventData)[]
  ): Promise<(Hash256 | undefined)[]> {
    if (datas.length === 0) {
      return []
    }
    const hashes = datas.map(toJsonString).map(hashData)
    const events = await this.knex('forced_transaction_events')
      .whereIn('data_hash', hashes)
      .andWhere('event_type', '=', 'mined')
    return hashes.map((hash) => {
      const event = events.find((event) => event.data_hash === hash)
      return event ? Hash256(event.transaction_hash) : undefined
    })
  }

  async discardAfter(blockNumber: number): Promise<void> {
    await this.knex('forced_transaction_events')
      .delete()
      .where('block_number', '>', blockNumber)
  }

  async deleteAll(): Promise<void> {
    await this.knex('forced_transaction_events').delete()
  }

  async getAllEvents(): Promise<EventRecord[]> {
    const rows = await this.knex('forced_transaction_events').select()
    return rows.map(toRecord)
  }

  async getLatest({
    limit,
    offset,
  }: {
    limit: number
    offset: number
  }): Promise<ForcedTransaction[]> {
    const latestTable = this.knex
      .select(
        this.knex.raw('max(timestamp) as max_timestamp'),
        'transaction_hash'
      )
      .from('forced_transaction_events as f1')
      .as('f1')
      .groupBy('transaction_hash')
      .orderBy('max_timestamp', 'desc')
      .limit(limit)
      .offset(offset)

    const rows = await this.knex
      .from('forced_transaction_events as f2')
      .as('f2')
      .innerJoin(latestTable, function () {
        return this.on('f1.transaction_hash', '=', 'f2.transaction_hash')
      })

    return eventRowsToTransactions(rows)
  }

  async getIncludedInStateUpdate(
    stateUpdateId: number
  ): Promise<ForcedTransaction[]> {
    const rows = await this.knex
      .from('forced_transaction_events')
      .whereIn(
        'transaction_hash',
        this.knex('forced_transaction_events')
          .select('transaction_hash')
          .whereRaw("data->>'stateUpdateId' = ?", stateUpdateId)
      )

    return eventRowsToTransactions(rows)
  }

  async getAffectingPosition(positionId: bigint): Promise<ForcedTransaction[]> {
    const rows = await this.knex
      .from('forced_transaction_events')
      .whereIn(
        'transaction_hash',
        this.knex('forced_transaction_events')
          .select('transaction_hash')
          .whereRaw("data->>'positionId' = ?", String(positionId))
          .orWhereRaw("data->>'positionIdA' = ?", String(positionId))
          .orWhereRaw("data->>'positionIdB' = ?", String(positionId))
      )

    return eventRowsToTransactions(rows)
  }

  async countAll(): Promise<bigint> {
    const result = await this.knex('forced_transaction_events').countDistinct(
      'transaction_hash'
    )
    return BigInt(result[0].count)
  }
}
