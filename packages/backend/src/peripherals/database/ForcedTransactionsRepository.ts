import { AssetId, Hash256, json, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { ForcedTransactionEventRow as EventRow } from 'knex/types/tables'
import { groupBy, omit, pick } from 'lodash'
import { MD5 as hashData } from 'object-hash'

import { Logger } from '../../tools/Logger'

interface EventRecordCandidateBase {
  id?: number
  transactionHash: Hash256
  timestamp: Timestamp
}

interface WithdrawalTransactionData {
  publicKey: StarkKey
  positionId: bigint
  amount: bigint
}

interface WithdrawalSentEventRecordCandidate
  extends EventRecordCandidateBase,
    WithdrawalTransactionData {
  transactionType: 'withdrawal'
  eventType: 'sent'
}

interface WithdrawalMinedEventRecordCandidate
  extends EventRecordCandidateBase,
    WithdrawalTransactionData {
  transactionType: 'withdrawal'
  eventType: 'mined'
  blockNumber: number
}

interface VerifiedEventBase {
  eventType: 'verified'
  stateUpdateId: number
}

export interface WithdrawalVerifiedEventRecordCandidate
  extends EventRecordCandidateBase,
    VerifiedEventBase {
  transactionType: 'withdrawal'
  blockNumber: number
}

interface TradeTransactionData {
  publicKeyA: StarkKey
  publicKeyB: StarkKey
  positionIdA: bigint
  positionIdB: bigint
  syntheticAssetId: AssetId
  isABuyingSynthetic: boolean
  collateralAmount: bigint
  syntheticAmount: bigint
  nonce: bigint
}

interface TradeSentEventRecordCandidate
  extends EventRecordCandidateBase,
    TradeTransactionData {
  transactionType: 'trade'
  eventType: 'sent'
}

interface TradeMinedEventRecordCandidate
  extends EventRecordCandidateBase,
    TradeTransactionData {
  transactionType: 'trade'
  eventType: 'mined'
  blockNumber: number
}

export interface TradeVerifiedEventRecordCandidate
  extends EventRecordCandidateBase,
    VerifiedEventBase {
  transactionType: 'trade'
  blockNumber: number
}

export type EventRecordCandidate =
  | TradeSentEventRecordCandidate
  | TradeMinedEventRecordCandidate
  | TradeVerifiedEventRecordCandidate
  | WithdrawalSentEventRecordCandidate
  | WithdrawalMinedEventRecordCandidate
  | WithdrawalVerifiedEventRecordCandidate

export type EventRecord = EventRecordCandidate & {
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

function recordCandidateToRow(
  candidate: EventRecordCandidate
): EventRowCandidate {
  const {
    id,
    transactionHash,
    transactionType: transaction_type,
    eventType: event_type,
    timestamp,
    ...data
  } = candidate

  const data_hash = hashData(omit(data, 'blockNumber'))

  return {
    id,
    transaction_hash: transactionHash.toString(),
    transaction_type,
    event_type,
    block_number:
      candidate.eventType !== 'sent' ? candidate.blockNumber : undefined,
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

  if (transactionType === 'withdrawal' && eventType === 'sent') {
    return {
      id,
      transactionHash,
      transactionType: 'withdrawal',
      eventType: 'sent',
      timestamp,
      publicKey: StarkKey(data.publicKey),
      positionId: BigInt(data.positionId),
      amount: BigInt(data.amount),
    }
  }
  if (transactionType === 'withdrawal' && eventType === 'mined') {
    return {
      id,
      transactionHash,
      transactionType: 'withdrawal',
      eventType: 'mined',
      timestamp,
      blockNumber: Number(row.block_number),
      publicKey: StarkKey(data.publicKey),
      positionId: BigInt(data.positionId),
      amount: BigInt(data.amount),
    }
  }
  if (row.transaction_type === 'trade' && row.event_type === 'sent') {
    return {
      id,
      transactionHash,
      transactionType: 'trade',
      eventType: 'sent',
      timestamp,
      publicKeyA: StarkKey(data.publicKeyA),
      publicKeyB: StarkKey(data.publicKeyB),
      positionIdA: BigInt(data.positionIdA),
      positionIdB: BigInt(data.positionIdB),
      collateralAmount: BigInt(data.collateralAmount),
      syntheticAmount: BigInt(data.syntheticAmount),
      isABuyingSynthetic: Boolean(data.isABuyingSynthetic),
      syntheticAssetId: AssetId(data.syntheticAssetId),
      nonce: BigInt(data.nonce),
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
      publicKeyA: StarkKey(data.publicKeyA),
      publicKeyB: StarkKey(data.publicKeyB),
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

interface SentWithdrawal extends WithdrawalTransactionData {
  hash: Hash256
  type: 'withdrawal'
  status: 'sent'
  lastUpdate: Timestamp
}

interface MinedWithdrawal extends WithdrawalTransactionData {
  hash: Hash256
  type: 'withdrawal'
  status: 'mined'
  lastUpdate: Timestamp
}

interface VerifiedWithdrawal extends Omit<MinedWithdrawal, 'status'> {
  status: 'verified'
  stateUpdateId: number
}

type Withdrawal = SentWithdrawal | MinedWithdrawal | VerifiedWithdrawal

interface SentTrade extends TradeTransactionData {
  hash: Hash256
  type: 'trade'
  status: 'sent'
  lastUpdate: Timestamp
}

interface MinedTrade extends TradeTransactionData {
  hash: Hash256
  type: 'trade'
  status: 'mined'
  lastUpdate: Timestamp
}

interface VerifiedTrade extends Omit<MinedTrade, 'status'> {
  status: 'verified'
  stateUpdateId: number
}

type Trade = SentTrade | MinedTrade | VerifiedTrade

export type ForcedTransaction = Withdrawal | Trade

function applyEvent(
  transaction: ForcedTransaction,
  event: EventRecord
): ForcedTransaction {
  if (event.transactionType === 'withdrawal' && event.eventType === 'sent') {
    return {
      type: 'withdrawal',
      status: 'sent',
      hash: event.transactionHash,
      lastUpdate: event.timestamp,
      ...pick(event, 'amount', 'positionId', 'publicKey'),
    }
  }
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
  if (event.transactionType === 'trade' && event.eventType === 'sent') {
    return {
      type: 'trade',
      status: 'sent',
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
        'syntheticAmount',
        'nonce'
      ),
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
        'syntheticAmount',
        'nonce'
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
    datas: (TradeTransactionData | WithdrawalTransactionData)[]
  ): Promise<(Hash256 | undefined)[]> {
    if (datas.length === 0) {
      return []
    }
    const hashes = datas.map(hashData)
    const events = await this.knex('forced_transaction_events')
      .whereIn('data_hash', hashes)
      .andWhere('event_type', '=', 'mined')
      .whereNotIn(
        'transaction_hash',
        this.knex('forced_transaction_events')
          .select('transaction_hash')
          .where('event_type', '=', 'verified')
      )
      .orderBy('id')

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

  async getByHashWithEvents(
    transactionHash: Hash256
  ): Promise<
    { transaction: ForcedTransaction; events: EventRecord[] } | undefined
  > {
    const rows = await this.knex('forced_transaction_events')
      .where('transaction_hash', '=', transactionHash.toString())
      .orderBy('timestamp')
    if (rows.length === 0) {
      return undefined
    }
    const events = rows.map(toRecord)
    const transaction = reduceEventsToTransaction(events)
    return {
      transaction,
      events,
    }
  }

  async countAll(): Promise<bigint> {
    const result = await this.knex('forced_transaction_events').countDistinct(
      'transaction_hash'
    )
    return BigInt(result[0].count)
  }

  async getPending(): Promise<ForcedTransaction[]> {
    const rows = await this.knex
      .from('forced_transaction_events')
      .whereNotIn(
        'transaction_hash',
        this.knex('forced_transaction_events')
          .select('transaction_hash')
          .where('event_type', '<>', 'sent')
      )
    return eventRowsToTransactions(rows)
  }

  async delete(hash: Hash256): Promise<void> {
    await this.knex('forced_transaction_events')
      .delete()
      .where('transaction_hash', '=', hash.toString())
  }
}
