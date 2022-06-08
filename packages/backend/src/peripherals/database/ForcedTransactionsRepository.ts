import { ForcedTrade, ForcedWithdrawal } from '@explorer/encoding'
import { AssetId, Hash256, json, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { ForcedTransactionRow, TransactionStatusRow } from 'knex/types/tables'
import { MD5 as hashData } from 'object-hash'

import { Logger } from '../../tools/Logger'
import { Nullable } from '../../utils/Nullable'
import { toSerializableJson } from '../../utils/toSerializableJson'
import { BaseRepository } from './BaseRepository'

export interface Updates {
  sentAt: Nullable<Timestamp>
  minedAt: Nullable<Timestamp>
  revertedAt: Nullable<Timestamp>
  forgottenAt: Nullable<Timestamp>
  verified:
    | {
        at: Timestamp
        stateUpdateId: number
      }
    | undefined
}
export interface ForcedTransactionRecord {
  hash: Hash256
  data: ForcedWithdrawal | ForcedTrade
  updates: Updates
  lastUpdateAt: Timestamp
}

function withdrawalFromJson(jsonData: json): ForcedWithdrawal {
  const data = Object(jsonData)
  return {
    type: 'withdrawal',
    starkKey: StarkKey(data.starkKey),
    amount: BigInt(data.amount),
    positionId: BigInt(data.positionId),
  }
}

function tradeFromJson(jsonData: json): ForcedTrade {
  const data = Object(jsonData)
  return {
    type: 'trade',
    starkKeyA: StarkKey(data.starkKeyA),
    starkKeyB: StarkKey(data.starkKeyB),
    positionIdA: BigInt(data.positionIdA),
    positionIdB: BigInt(data.positionIdB),
    collateralAmount: BigInt(data.collateralAmount),
    syntheticAmount: BigInt(data.syntheticAmount),
    isABuyingSynthetic: Boolean(data.isABuyingSynthetic),
    syntheticAssetId: AssetId(data.syntheticAssetId),
    nonce: BigInt(data.nonce),
  }
}

function getLastUpdate(updates: Updates): Timestamp {
  const values = [
    updates.sentAt,
    updates.forgottenAt,
    updates.revertedAt,
    updates.minedAt,
    updates.verified?.at,
  ]
  const max = values.reduce<Timestamp>(
    (max, value) => (!value ? max : value > max ? value : max),
    Timestamp(0n)
  )
  return max
}

function getType(type: string): 'withdrawal' | 'trade' {
  if (type !== 'trade' && type !== 'withdrawal') {
    throw new Error('Cannot determine type: ' + type)
  }
  return type
}

interface Row
  extends ForcedTransactionRow,
    Omit<TransactionStatusRow, 'block_number' | 'hash'> {
  verified_at: bigint | null
}

function toRecord(row: Row): ForcedTransactionRecord {
  const type = getType(row.type)
  const toTimestamp = (value: bigint | null) =>
    value !== null ? Timestamp(value) : null

  const updates = {
    sentAt: toTimestamp(row.sent_at),
    forgottenAt: toTimestamp(row.forgotten_at),
    revertedAt: toTimestamp(row.reverted_at),
    minedAt: toTimestamp(row.mined_at),
    verified:
      row.verified_at !== null && row.state_update_id !== null
        ? {
            at: Timestamp(row.verified_at),
            stateUpdateId: row.state_update_id,
          }
        : undefined,
  }
  return {
    hash: Hash256(row.hash),
    data:
      type === 'trade' ? tradeFromJson(row.data) : withdrawalFromJson(row.data),
    updates,
    lastUpdateAt: getLastUpdate(updates),
  }
}

export class ForcedTransactionsRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.getAll = this.wrapGet(this.getAll)
    this.getLatest = this.wrapGet(this.getLatest)
    this.getIncludedInStateUpdate = this.wrapGet(this.getIncludedInStateUpdate)
    this.getByPositionId = this.wrapGet(this.getByPositionId)
    this.countPendingByPositionId = this.wrapAny(this.countPendingByPositionId)
    this.findByHash = this.wrapFind(this.findByHash)
    this.deleteAll = this.wrapDelete(this.deleteAll)
  }

  private joinQuery() {
    return this.knex('forced_transactions')
      .innerJoin(
        'transaction_status',
        'transaction_status.hash',
        'forced_transactions.hash'
      )
      .leftJoin(
        'state_updates',
        'state_updates.id',
        'forced_transactions.state_update_id'
      )
  }

  private rowsQuery() {
    return this.joinQuery().select(
      'forced_transactions.*',
      'state_updates.timestamp as verified_at',
      'transaction_status.mined_at',
      'transaction_status.sent_at',
      'transaction_status.reverted_at',
      'transaction_status.forgotten_at'
    )
  }

  async getAll(): Promise<ForcedTransactionRecord[]> {
    const rows = await this.rowsQuery()
    return rows.map(toRecord)
  }

  async getLatest({
    limit,
    offset,
  }: {
    limit: number
    offset: number
  }): Promise<ForcedTransactionRecord[]> {
    const rows = await this.rowsQuery()
      .select(
        this.knex.raw(`greatest(
      "timestamp",
      "mined_at",
      "sent_at",
      "reverted_at",
      "forgotten_at"
    ) as last_update_at`)
      )
      .orderBy('last_update_at', 'desc')
      .offset(offset)
      .limit(limit)
    return rows.map(toRecord)
  }

  async getIncludedInStateUpdate(
    stateUpdateId: number
  ): Promise<ForcedTransactionRecord[]> {
    const rows = await this.rowsQuery().where(
      'state_update_id',
      '=',
      stateUpdateId
    )
    return rows.map(toRecord)
  }

  async countPendingByPositionId(positionId: bigint) {
    const [{ count }] = await this.joinQuery()
      .where(function () {
        this.whereRaw("data->>'positionId' = ?", String(positionId))
          .orWhereRaw("data->>'positionIdA' = ?", String(positionId))
          .orWhereRaw("data->>'positionIdB' = ?", String(positionId))
      })
      .whereNull('state_update_id')
      .whereNull('reverted_at')
      .whereNull('forgotten_at')
      .count()

    return Number(count)
  }

  async getByPositionId(
    positionId: bigint
  ): Promise<ForcedTransactionRecord[]> {
    const rows = await this.rowsQuery()
      .whereRaw("data->>'positionId' = ?", String(positionId))
      .orWhereRaw("data->>'positionIdA' = ?", String(positionId))
      .orWhereRaw("data->>'positionIdB' = ?", String(positionId))
    return rows.map(toRecord)
  }

  async getTransactionHashesByData(
    datas: (ForcedWithdrawal | ForcedTrade)[]
  ): Promise<(Hash256 | undefined)[]> {
    if (datas.length === 0) {
      return []
    }
    const hashes = datas.map(hashData)
    const transactions = await this.knex('forced_transactions')
      .whereIn('data_hash', hashes)
      .whereNull('state_update_id')
      .orderBy('hash')
    const matched = hashes.map((hash) => {
      const transaction = transactions.find((event) => event.data_hash === hash)
      return transaction ? Hash256(transaction.hash) : undefined
    })
    this.logger.debug({
      method: 'getTransactionHashesByData',
      requested: hashes.length,
      matched: matched.length,
    })
    return matched
  }

  async findByHash(
    hash: Hash256
  ): Promise<ForcedTransactionRecord | undefined> {
    const [row] = await this.rowsQuery().where(
      'forced_transactions.hash',
      '=',
      hash.toString()
    )

    return row ? toRecord(row) : undefined
  }

  async add(
    transaction: Omit<ForcedTransactionRecord, 'lastUpdateAt' | 'updates'> & {
      offerId?: number
    },
    sentAt: Timestamp
  ): Promise<Hash256>

  async add(
    transaction: Omit<ForcedTransactionRecord, 'lastUpdateAt' | 'updates'> & {
      offerId?: number
    },
    sentAt: Nullable<Timestamp>,
    minedAt: Timestamp,
    blockNumber: number
  ): Promise<Hash256>

  async add(
    transaction: Omit<ForcedTransactionRecord, 'lastUpdateAt' | 'updates'> & {
      offerId?: number
    },
    sentAt: Nullable<Timestamp>,
    minedAt?: Timestamp,
    blockNumber?: number
  ): Promise<Hash256> {
    const { hash, data } = transaction
    await this.knex.transaction(async (trx) => {
      await trx('forced_transactions').insert({
        hash: hash.toString(),
        type: data.type,
        data: toSerializableJson(data),
        data_hash: hashData(data),
      })
      await trx('transaction_status').insert({
        hash: hash.toString(),
        mined_at:
          minedAt !== null && minedAt !== undefined
            ? BigInt(minedAt.toString())
            : null,
        sent_at: sentAt !== null ? BigInt(sentAt.toString()) : null,
        block_number: blockNumber,
      })
      if (transaction.offerId && transaction.data.type === 'trade') {
        await trx('forced_trade_offers')
          .update({ transaction_hash: hash.toString() })
          .whereNull('transaction_hash')
          .andWhere({ id: transaction.offerId })
      }
    })
    this.logger.debug({ method: 'add', id: hash.toString() })
    return hash
  }

  async countAll(): Promise<number> {
    const result = await this.knex('forced_transactions').count()
    const count = Number(result[0].count)
    this.logger.debug({ method: 'countAll', count })
    return count
  }

  async deleteAll(): Promise<number> {
    const deleted = await this.knex.transaction(async (trx) => {
      const hashes = await trx('forced_transactions').select('hash')
      await trx('forced_transactions').delete()
      await trx('transaction_status')
        .whereIn(
          'hash',
          hashes.map((h) => h.toString())
        )
        .delete()
      return hashes.length
    })
    return deleted
  }
}
