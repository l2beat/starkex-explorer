import { ForcedTrade, ForcedWithdrawal } from '@explorer/encoding'
import {
  AssetId,
  EthereumAddress,
  Hash256,
  json,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { Knex } from 'knex'
import { ForcedTransactionRow, TransactionStatusRow } from 'knex/types/tables'
import { MD5 as hashData } from 'object-hash'

import { Logger } from '../../tools/Logger'
import { toSerializableJson } from '../../utils/toSerializableJson'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface FinalizeExitAction {
  starkKey: StarkKey
  assetType: AssetId
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
  recipient: EthereumAddress
}

export interface TransactionUpdates {
  sentAt: Timestamp | null
  minedAt: Timestamp | null
  revertedAt: Timestamp | null
  forgottenAt: Timestamp | null
}

export interface FinalizeUpdates extends TransactionUpdates {
  hash: Hash256
}

export interface Updates extends TransactionUpdates {
  verified:
    | {
        at: Timestamp
        stateUpdateId: number
      }
    | undefined
  finalized?: FinalizeUpdates
}
export interface ForcedTransactionRecord {
  hash: Hash256
  data: ForcedWithdrawal | ForcedTrade
  updates: Updates
  lastUpdateAt: Timestamp
}

function withdrawalFromJson(jsonData: json): ForcedWithdrawal {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
  const data = Object(jsonData)
  return {
    type: 'withdrawal',
    starkKey: StarkKey(data.starkKey),
    amount: BigInt(data.amount),
    positionId: BigInt(data.positionId),
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
}

function tradeFromJson(jsonData: json): ForcedTrade {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
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
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
}

function getLastUpdate(updates: Updates): Timestamp {
  const values = [
    updates.sentAt,
    updates.forgottenAt,
    updates.revertedAt,
    updates.minedAt,
    updates.verified?.at,
    updates.finalized?.sentAt,
    updates.finalized?.forgottenAt,
    updates.finalized?.revertedAt,
    updates.finalized?.minedAt,
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
  finalize_sent_at: bigint | null
  finalize_forgotten_at: bigint | null
  finalize_reverted_at: bigint | null
  finalize_mined_at: bigint | null
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
    finalized:
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      row.finalize_hash !== null
        ? {
            hash: Hash256(row.finalize_hash),
            sentAt: toTimestamp(row.finalize_sent_at),
            forgottenAt: toTimestamp(row.finalize_forgotten_at),
            revertedAt: toTimestamp(row.finalize_reverted_at),
            minedAt: toTimestamp(row.finalize_mined_at),
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

export class ForcedTransactionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.getAll = this.wrapGet(this.getAll)
    this.getLatest = this.wrapGet(this.getLatest)
    this.getIncludedInStateUpdate = this.wrapGet(this.getIncludedInStateUpdate)
    this.getByPositionId = this.wrapGet(this.getByPositionId)
    this.countPendingByPositionId = this.wrapAny(this.countPendingByPositionId)
    this.findByHash = this.wrapFind(this.findByHash)
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  private joinQuery(knex: Knex) {
    return knex('forced_transactions')
      .innerJoin(
        'transaction_status as exit_tx',
        'exit_tx.hash',
        'forced_transactions.hash'
      )
      .leftJoin(
        'state_updates',
        'state_updates.id',
        'forced_transactions.state_update_id'
      )
      .leftJoin(
        'transaction_status as finalize_tx',
        'finalize_tx.hash',
        'forced_transactions.finalize_hash'
      )
  }

  private rowsQuery(knex: Knex) {
    return this.joinQuery(knex).select(
      'forced_transactions.*',
      'state_updates.timestamp as verified_at',
      'exit_tx.mined_at',
      'exit_tx.sent_at',
      'exit_tx.reverted_at',
      'exit_tx.forgotten_at',
      'finalize_tx.mined_at as finalize_mined_at',
      'finalize_tx.sent_at as finalize_sent_at',
      'finalize_tx.reverted_at as finalize_reverted_at',
      'finalize_tx.forgotten_at as finalize_forgotten_at'
    )
  }

  private sortedRowsQuery(knex: Knex) {
    return this.rowsQuery(knex)
      .select(
        knex.raw(`greatest(
      "timestamp",
      "exit_tx"."mined_at",
      "exit_tx"."sent_at",
      "exit_tx"."reverted_at",
      "exit_tx"."forgotten_at",
      "finalize_tx"."mined_at",
      "finalize_tx"."sent_at",
      "finalize_tx"."reverted_at",
      "finalize_tx"."forgotten_at"
    ) as last_update_at`)
      )
      .orderBy('last_update_at', 'desc')
  }

  async getAll(): Promise<ForcedTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await this.rowsQuery(knex)
    return rows.map(toRecord)
  }

  async getLatest({
    limit,
    offset,
  }: {
    limit: number
    offset: number
  }): Promise<ForcedTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await this.sortedRowsQuery(knex).offset(offset).limit(limit)
    return rows.map(toRecord)
  }

  async getIncludedInStateUpdate(
    stateUpdateId: number
  ): Promise<ForcedTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await this.rowsQuery(knex).where(
      'state_update_id',
      '=',
      stateUpdateId
    )
    return rows.map(toRecord)
  }

  async countPendingByPositionId(positionId: bigint) {
    const knex = await this.knex()
    const [result] = await this.joinQuery(knex)
      .where(function () {
        void this.whereRaw("data->>'positionId' = ?", String(positionId))
          .orWhereRaw("data->>'positionIdA' = ?", String(positionId))
          .orWhereRaw("data->>'positionIdB' = ?", String(positionId))
      })
      .whereNull('state_update_id')
      .whereNull('exit_tx.reverted_at')
      .whereNull('exit_tx.forgotten_at')
      .count()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async getByPositionId(
    positionId: bigint
  ): Promise<ForcedTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await this.sortedRowsQuery(knex)
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
    const knex = await this.knex()
    const transactions = await knex('forced_transactions')
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
    const knex = await this.knex()
    const [row] = (await this.rowsQuery(knex).where(
      'forced_transactions.hash',
      '=',
      hash.toString()
    )) as Row[]

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return row ? toRecord(row) : undefined
  }

  async findByFinalizeHash(
    hash: Hash256
  ): Promise<ForcedTransactionRecord | undefined> {
    const knex = await this.knex()
    const [row] = (await this.rowsQuery(knex).where(
      'finalize_tx.hash',
      hash.toString()
    )) as Row[]

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return row ? toRecord(row) : undefined
  }

  async findLatestFinalize(): Promise<Timestamp | undefined> {
    const knex = await this.knex()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const row = await this.rowsQuery(knex)
      .whereNotNull('finalize_tx.mined_at')
      .orderBy('finalize_tx.mined_at', 'desc')
      .first()
      .select('finalize_tx.mined_at as finalized_at')

    // eslint-disable-next-line
    return row ? Timestamp(row.finalized_at) : undefined
  }

  async getWithdrawalsForFinalize(
    starkKey: StarkKey,
    finalizeMinedAt: Timestamp,
    previousFinalizeMinedAt: Timestamp
  ): Promise<ForcedTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await this.rowsQuery(knex)
      .whereRaw("data->>'type' = 'withdrawal'")
      .whereRaw("data->>'starkKey' = ?", String(starkKey))
      .whereNull('finalize_tx.mined_at')
      .where('state_updates.timestamp', '<', Number(finalizeMinedAt))
      .where('state_updates.timestamp', '>', Number(previousFinalizeMinedAt))
      .orderBy('state_updates.timestamp', 'desc')

    return rows.map(toRecord)
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
    sentAt: Timestamp | null,
    minedAt: Timestamp,
    blockNumber: number
  ): Promise<Hash256>

  async add(
    transaction: Omit<ForcedTransactionRecord, 'lastUpdateAt' | 'updates'> & {
      offerId?: number
    },
    sentAt: Timestamp | null,
    minedAt?: Timestamp,
    blockNumber?: number
  ): Promise<Hash256> {
    const { hash, data } = transaction
    const knex = await this.knex()
    await knex.transaction(async (trx) => {
      await trx('forced_transactions').insert({
        hash: hash.toString(),
        type: data.type,
        data: toSerializableJson(data),
        data_hash: hashData(data),
      })
      await trx('transaction_status').insert({
        hash: hash.toString(),
        mined_at:
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
  async saveFinalize(
    exitHash: Hash256,
    finalizeHash: Hash256,
    sentAt: Timestamp
  ): Promise<boolean>

  async saveFinalize(
    exitHash: Hash256,
    finalizeHash: Hash256,
    sentAt: Timestamp | null,
    minedAt: Timestamp,
    blockNumber: number
  ): Promise<boolean>

  async saveFinalize(
    exitHash: Hash256,
    finalizeHash: Hash256,
    sentAt: Timestamp,
    minedAt?: Timestamp,
    blockNumber?: number
  ): Promise<boolean> {
    const knex = await this.knex()
    await knex.transaction(async (trx) => {
      await trx('forced_transactions')
        .where({ hash: exitHash.toString() })
        .update({
          finalize_hash: finalizeHash.toString(),
        })
      await trx('transaction_status')
        .insert({
          hash: finalizeHash.toString(),
          mined_at:
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            minedAt !== null && minedAt !== undefined
              ? BigInt(minedAt.toString())
              : null,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          sent_at: sentAt !== null ? BigInt(sentAt.toString()) : null,
          block_number: blockNumber,
        })
        .onConflict('hash')
        .ignore()
    })
    this.logger.debug({ method: 'saveFinalize', id: exitHash.toString() })
    return true
  }

  async countAll(): Promise<number> {
    const knex = await this.knex()
    const [result] = await knex('forced_transactions').count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const count = Number(result!.count)
    this.logger.debug({ method: 'countAll', count })
    return count
  }

  async deleteAll(): Promise<number> {
    const knex = await this.knex()
    const deleted = await knex.transaction(async (trx) => {
      const hashes = await trx('forced_transactions').select('hash')
      await trx('forced_transactions').delete()
      await trx('transaction_status').whereIn('hash', hashes).delete()
      return hashes.length
    })
    return deleted
  }
}
