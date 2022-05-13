import { ForcedAction, ForcedTrade, ForcedWithdrawal } from '@explorer/encoding'
import { AssetId, Hash256, json, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { ForcedTransactionRow, TransactionStatusRow } from 'knex/types/tables'
import { MD5 as hashData } from 'object-hash'

import { Logger } from '../../tools/Logger'
import { noUndefined } from '../../utils/noUndefined'
import { toSerializableJson } from '../../utils/toSerializableJson'

export interface ForcedTransactionRecord {
  hash: Hash256
  data: ForcedWithdrawal | ForcedTrade
  updates: {
    sentAt: Timestamp | undefined
    minedAt: Timestamp | undefined
    revertedAt: Timestamp | undefined
    forgottenAt: Timestamp | undefined
    verified:
      | {
          at: Timestamp
          stateUpdateId: number
        }
      | undefined
  }
  lastUpdateAt: Timestamp
}

function withdrawalFromJson(jsonData: json): ForcedWithdrawal {
  const data = Object(jsonData)
  return {
    type: 'withdrawal',
    publicKey: StarkKey(data.publicKey),
    amount: BigInt(data.amount),
    positionId: BigInt(data.positionId),
  }
}

function tradeFromJson(jsonData: json): ForcedTrade {
  const data = Object(jsonData)
  return {
    type: 'trade',
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

function getLastUpdate(updates: ForcedTransactionRecord['updates']): Timestamp {
  const values = [
    updates.sentAt,
    updates.forgottenAt,
    updates.revertedAt,
    updates.minedAt,
    updates.verified?.at,
  ]
  const max = values.reduce<Timestamp>(
    (max, value) => (value === undefined ? max : value > max ? value : max),
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
  verified_at?: bigint
}

function toRecord(row: Row): ForcedTransactionRecord {
  const type = getType(row.type)
  const toTimestamp = (value: bigint | undefined) =>
    value !== undefined ? Timestamp(value) : undefined

  const updates: ForcedTransactionRecord['updates'] = {
    sentAt: toTimestamp(row.sent_at),
    forgottenAt: toTimestamp(row.forgotten_at),
    revertedAt: toTimestamp(row.reverted_at),
    minedAt: toTimestamp(row.mined_at),
    verified:
      row.verified_at !== undefined
        ? {
            at: Timestamp(row.verified_at),
            stateUpdateId: noUndefined(row.state_update_id),
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

export class ForcedTransactionsRepository {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async deleteAll(): Promise<void> {
    await this.knex.transaction(async (trx) => {
      const hashes = await trx('forced_transactions').select('hash')
      await trx('forced_transactions').delete()
      await trx('transaction_status')
        .whereIn(
          'hash',
          hashes.map((h) => h.toString())
        )
        .delete()
    })
  }

  private rowsQuery() {
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
      .select(
        'forced_transactions.*',
        'state_updates.timestamp as verified_at',
        'transaction_status.mined_at',
        'transaction_status.sent_at',
        'transaction_status.reverted_at',
        'transaction_status.forgotten_at'
      )
  }

  async getLatest({
    limit,
    offset,
  }: {
    limit: number
    offset: number
  }): Promise<ForcedTransactionRecord[]> {
    // TODO: paginate in sql
    const rows = await this.rowsQuery()
    const transactions = rows.map(toRecord)
    transactions.sort((a, b) => +a.lastUpdateAt - +b.lastUpdateAt)
    return transactions.slice(offset, offset + limit)
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

  async getAll(): Promise<ForcedTransactionRecord[]> {
    const rows = await this.rowsQuery()
    return rows.map(toRecord)
  }

  async getAffectingPosition(
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
      .andWhereRaw('state_update_id is null')
      .orderBy('hash')

    return hashes.map((hash) => {
      const transaction = transactions.find((event) => event.data_hash === hash)
      return transaction ? Hash256(transaction.hash) : undefined
    })
  }

  async countAll(): Promise<bigint> {
    const result = await this.knex('forced_transactions').count()
    return BigInt(result[0].count)
  }

  async findByHash(
    hash: Hash256
  ): Promise<ForcedTransactionRecord | undefined> {
    const [row] = await this.rowsQuery().where(
      'forced_transactions.hash',
      '=',
      hash.toString()
    )

    if (!row) {
      return undefined
    }

    return toRecord(row)
  }

  async addSent(
    transaction: ForcedAction & {
      hash: Hash256
      sentAt: Timestamp
    }
  ): Promise<void> {
    const { hash, type, sentAt, ...data } = transaction
    await this.knex.transaction(async (trx) => {
      await trx('forced_transactions').insert({
        hash: hash.toString(),
        type,
        data: toSerializableJson(data),
        data_hash: hashData(data),
      })
      await trx('transaction_status').insert({
        hash: hash.toString(),
        sent_at: sentAt ? BigInt(sentAt.toString()) : undefined,
      })
    })
  }

  async addMined(
    transaction: ForcedAction & {
      hash: Hash256
      minedAt: Timestamp
      sentAt?: Timestamp
      blockNumber: number
    }
  ): Promise<void> {
    const { hash, type, blockNumber, minedAt, sentAt, ...data } = transaction
    await this.knex.transaction(async (trx) => {
      await trx('forced_transactions').insert({
        hash: hash.toString(),
        type,
        data: toSerializableJson(data),
        data_hash: hashData(data),
      })
      await trx('transaction_status').insert({
        hash: hash.toString(),
        mined_at: BigInt(minedAt.toString()),
        sent_at: sentAt ? BigInt(sentAt.toString()) : undefined,
        block_number: blockNumber,
      })
    })
  }

  async markAsMined(
    hash: Hash256,
    blockNumber: number,
    minedAt: Timestamp
  ): Promise<void> {
    await this.knex('transaction_status')
      .update({
        block_number: blockNumber,
        mined_at: BigInt(minedAt.toString()),
      })
      .where('hash', '=', hash.toString())
  }
}
