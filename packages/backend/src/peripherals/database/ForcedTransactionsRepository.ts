import { AssetId, json, Timestamp } from '@explorer/types'
import { createHash } from 'crypto'
import { Knex } from 'knex'
import { ForcedTransactionEventRow } from 'knex/types/tables'
import { groupBy, pick } from 'lodash'

import { Logger } from '../../tools/Logger'

type RecordCandidate = {
  id?: number
  transactionHash: string
  timestamp: Timestamp
}

type MinedWithdrawalData = {
  publicKey: string
  positionId: bigint
  amount: bigint
}

type MinedWithdrawalCandidate = RecordCandidate &
  MinedWithdrawalData & {
    transactionType: 'withdrawal'
    eventType: 'mined'
    blockNumber: number
  }

type Verified = {
  eventType: 'verified'
  stateUpdateId: number
}

export type VerifiedWithdrawalCandidate = RecordCandidate &
  Verified & {
    transactionType: 'withdrawal'
    blockNumber: number
  }

type WithdrawalCandidate =
  | MinedWithdrawalCandidate
  | VerifiedWithdrawalCandidate

type MinedTradeData = {
  publicKeyA: string
  publicKeyB: string
  positionIdA: bigint
  positionIdB: bigint
  syntheticAssetId: AssetId
  isABuyingSynthetic: boolean
  collateralAmount: bigint
  syntheticAmount: bigint
}

type MinedTradeCandidate = RecordCandidate &
  MinedTradeData & {
    transactionType: 'trade'
    eventType: 'mined'
    blockNumber: number
  }

export type VerifiedTradeCandidate = RecordCandidate &
  Verified & {
    transactionType: 'trade'
    blockNumber: number
  }

type TradeCandidate = MinedTradeCandidate | VerifiedTradeCandidate

type TransactionEventRecordCandidate = TradeCandidate | WithdrawalCandidate

type TransactionEventRecord = TransactionEventRecordCandidate & {
  id: ForcedTransactionEventRow['id']
}

type TransactionEventRowCandidate = Omit<ForcedTransactionEventRow, 'id'> & {
  id?: ForcedTransactionEventRow['id']
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
  candidate: TransactionEventRecordCandidate
): TransactionEventRowCandidate {
  const {
    id,
    transactionHash: transaction_hash,
    transactionType: transaction_type,
    eventType: event_type,
    blockNumber: block_number,
    timestamp,
    ...rest
  } = candidate

  const data =
    event_type === 'mined'
      ? {
          ...rest,
          hash: hashData(toJsonString(rest)),
        }
      : rest

  return {
    id,
    transaction_hash,
    transaction_type,
    event_type,
    block_number,
    timestamp: BigInt(Number(timestamp)),
    data: toSerializableJson(data),
  }
}

function toRecord(row: ForcedTransactionEventRow): TransactionEventRecord {
  const {
    id,
    transaction_hash: transactionHash,
    transaction_type: transactionType,
    event_type: eventType,
  } = row
  const data = Object(row.data)
  const timestamp = Timestamp(row.timestamp)

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
  hash: string
  type: 'withdrawal'
  status: 'mined'
  lastUpdate: Timestamp
} & MinedWithdrawalData

type VerifiedWithdrawal = Omit<MinedWithdrawal, 'status'> & {
  status: 'verified'
  stateUpdateId: number
}

type Withdrawal = MinedWithdrawal | VerifiedWithdrawal

type MinedTrade = {
  hash: string
  type: 'trade'
  status: 'mined'
  lastUpdate: Timestamp
} & MinedTradeData

type VerifiedTrade = Omit<MinedTrade, 'status'> & {
  status: 'verified'
  stateUpdateId: number
}

type Trade = MinedTrade | VerifiedTrade

type Transaction = Withdrawal | Trade

function applyEvent(
  transaction: Transaction,
  event: TransactionEventRecord
): Transaction {
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

function reduceEventsToTransaction(
  events: TransactionEventRecord[]
): Transaction {
  const sorted = events.sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  )
  return sorted.reduce(applyEvent, {} as Transaction)
}

function eventRowsToTransactions(
  rows: ForcedTransactionEventRow[]
): Transaction[] {
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

  async addEvents(
    candidates: TransactionEventRecordCandidate[]
  ): Promise<void> {
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
    datas: (MinedTradeData | MinedWithdrawalData)[]
  ): Promise<(string | undefined)[]> {
    if (datas.length === 0) {
      return []
    }
    const hashes = datas.map(toJsonString).map(hashData)
    const events = await this.knex('forced_transaction_events').whereRaw(
      "data->>'hash' = any(?)",
      [hashes]
    )
    return hashes.map((hash) => {
      const event = events.find(
        (event) => String(Object(event.data).hash) === hash
      )
      return event?.transaction_hash
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

  async getAll(): Promise<TransactionEventRecord[]> {
    const rows = await this.knex('forced_transaction_events').select()
    return rows.map(toRecord)
  }

  async getLatest(limit: number, offset = 0): Promise<Transaction[]> {
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
  ): Promise<Transaction[]> {
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

  async getAffectingPosition(positionId: bigint): Promise<Transaction[]> {
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
}
