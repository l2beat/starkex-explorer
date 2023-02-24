import { Hash256, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { UserTransactionRow } from 'knex/types/tables'

import { Logger } from '../../../tools/Logger'
import { BaseRepository } from '../shared/BaseRepository'
import { Database } from '../shared/Database'
import {
  decodeUserTransactionData,
  encodeUserTransactionData,
  UserTransactionData,
} from './UserTransaction'

export interface UserTransactionRecord<
  T extends UserTransactionData['type'] = UserTransactionData['type']
> {
  id: number
  transactionHash: Hash256
  starkKeyA: StarkKey
  starkKeyB?: StarkKey
  vaultOrPositionIdA?: bigint
  vaultOrPositionIdB?: bigint
  blockNumber: number
  timestamp: Timestamp
  included?: {
    blockNumber: number
    timestamp: Timestamp
    stateUpdateId: number
  }
  data: Extract<UserTransactionData, { type: T }>
}

export interface IncludedForcedRequestRecord {
  transactionHash: Hash256
  blockNumber: number
  timestamp: Timestamp
  stateUpdateId: number
}

interface RowWithIncluded extends UserTransactionRow {
  included_block_number: number | null
  included_timestamp: bigint | null
  included_state_update_id: number | null
}

export type UserTransactionAddRecord = Parameters<
  UserTransactionRepository['add']
>['0']

export class UserTransactionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.addManyIncluded = this.wrapAddMany(this.addManyIncluded)
    this.getByStarkKey = this.wrapGet(this.getByStarkKey)
    this.getByPositionId = this.wrapGet(this.getByPositionId)
    this.getByStateUpdateId = this.wrapGet(this.getByStateUpdateId)
    this.getByStateUpdateIdAndPositionId = this.wrapGet(
      this.getByStateUpdateIdAndPositionId
    )
    this.getPaginated = this.wrapGet(this.getPaginated)
    this.getByStarkKeyPaginated = this.wrapGet(this.getByStarkKeyPaginated)
    this.getNotIncluded = this.wrapGet(this.getNotIncluded)
    this.countAll = this.wrapAny(this.countAll)
    this.findById = this.wrapFind(this.findById)
    this.findByTransactionHash = this.wrapFind(this.findByTransactionHash)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: {
    transactionHash: Hash256
    blockNumber: number
    timestamp: Timestamp
    data: UserTransactionData
  }): Promise<number> {
    const knex = await this.knex()
    const encoded = encodeUserTransactionData(record.data)
    const results = await knex('user_transactions')
      .insert({
        transaction_hash: record.transactionHash.toString(),
        type: encoded.data.type,
        stark_key_a: encoded.starkKeyA.toString(),
        stark_key_b: encoded.starkKeyB?.toString(),
        vault_or_position_id_a: encoded.vaultOrPositionIdA,
        vault_or_position_id_b: encoded.vaultOrPositionIdB,
        timestamp: BigInt(record.timestamp.toString()),
        block_number: record.blockNumber,
        data: encoded.data,
      })
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async addManyIncluded(records: IncludedForcedRequestRecord[]) {
    const knex = await this.knex()
    await knex('included_forced_requests').insert(
      records.map((record) => ({
        transaction_hash: record.transactionHash.toString(),
        block_number: record.blockNumber,
        timestamp: BigInt(record.timestamp.toString()),
        state_update_id: record.stateUpdateId,
      }))
    )
    return records.map((x) => x.transactionHash)
  }

  async getByStarkKey<T extends UserTransactionData['type']>(
    starkKey: StarkKey,
    types?: T[]
  ): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = queryWithIncluded(knex)
    if (types) {
      query = query.whereIn('type', types)
    }
    query = query
      .where('stark_key_a', starkKey.toString())
      .orWhere('stark_key_b', starkKey.toString())
      .orderBy('timestamp', 'desc')
    return toRecords<T>(await query)
  }

  async getByPositionId<T extends UserTransactionData['type']>(
    positionId: bigint,
    types?: T[]
  ): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = queryWithIncluded(knex)
    if (types) {
      query = query.whereIn('type', types)
    }
    query = query
      .where('vault_or_position_id_a', positionId as unknown as Knex.Value)
      .orWhere('vault_or_position_id_b', positionId as unknown as Knex.Value)
      .orderBy('timestamp', 'desc')
    return toRecords<T>(await query)
  }

  async getByStateUpdateId<T extends UserTransactionData['type']>(
    stateUpdateId: number,
    types?: T[]
  ): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = queryWithIncluded(knex).where('state_update_id', stateUpdateId)
    if (types) {
      query = query.whereIn('type', types)
    }
    query = query.orderBy('timestamp', 'desc')
    return toRecords<T>(await query)
  }

  async getByStateUpdateIdAndPositionId<T extends UserTransactionData['type']>(
    stateUpdateId: number,
    positionId: bigint,
    types?: T[]
  ): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = queryWithIncluded(knex)
    if (types) {
      query = query.whereIn('type', types)
    }
    query = query
      .where('state_update_id', stateUpdateId)
      .where('vault_or_position_id_a', positionId as unknown as Knex.Value)
      .orWhere('vault_or_position_id_b', positionId as unknown as Knex.Value)
      .orderBy('timestamp', 'desc')
    return toRecords<T>(await query)
  }

  async getPaginated<T extends UserTransactionData['type']>(options: {
    limit: number
    offset: number
    types?: T[]
  }): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = queryWithIncluded(knex)
      .limit(options.limit)
      .offset(options.offset)
      .orderBy('timestamp', 'desc')
    if (options.types) {
      query = query.whereIn('type', options.types)
    }
    return toRecords<T>(await query)
  }

  async getByStarkKeyPaginated<T extends UserTransactionData['type']>(options: {
    starkKey: StarkKey
    limit: number
    offset: number
    types?: T[]
  }): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = queryWithIncluded(knex)
      .where('stark_key_a', options.starkKey.toString())
      .orWhere('stark_key_b', options.starkKey.toString())
      .limit(options.limit)
      .offset(options.offset)
      .orderBy('timestamp', 'desc')
    if (options.types) {
      query = query.whereIn('type', options.types)
    }
    return toRecords<T>(await query)
  }

  async getNotIncluded<T extends UserTransactionData['type']>(
    types?: T[]
  ): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = queryWithIncluded(knex)
      .where('included_forced_requests.transaction_hash', null)
      .orderBy('timestamp', 'asc')
    if (types) {
      query = query.whereIn('type', types)
    }
    return toRecords<T>(await query)
  }

  async countAll(types?: UserTransactionData['type'][]): Promise<number> {
    const knex = await this.knex()
    let query = knex('user_transactions')
    if (types) {
      query = query.whereIn('type', types)
    }
    const [result] = await query.count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async findById(id: number): Promise<UserTransactionRecord | undefined> {
    const knex = await this.knex()
    const result = await queryWithIncluded(knex).where('id', id).first()
    return result ? toRecord(result) : undefined
  }

  async findByTransactionHash<T extends UserTransactionData['type']>(
    transactionHash: Hash256,
    types?: T[]
  ): Promise<UserTransactionRecord<T> | undefined> {
    const knex = await this.knex()
    let query = queryWithIncluded(knex)
      .where('user_transactions.transaction_hash', transactionHash.toString())
      .first()
    if (types) {
      query = query.whereIn('type', types)
    }
    const result = await query
    return result ? toRecord(result) : undefined
  }

  async findFirstWithdrawByStarkKeyAfter(
    starkKey: StarkKey,
    timestamp: Timestamp
  ): Promise<UserTransactionRecord<'Withdraw'> | undefined> {
    const knex = await this.knex()
    const result = await knex('user_transactions')
      .where('type', 'Withdraw')
      .where('stark_key_a', starkKey.toString())
      .where('timestamp', '>', BigInt(timestamp.toString()))
      .orderBy('timestamp', 'asc')
      .first()
    return result
      ? toRecord({
          ...result,
          included_block_number: null,
          included_state_update_id: null,
          included_timestamp: null,
        })
      : undefined
  }

  async deleteAfter(blockNumber: number): Promise<number> {
    const knex = await this.knex()
    const a = await knex('user_transactions')
      .where('block_number', '>', blockNumber)
      .delete()
    const b = await knex('included_forced_requests')
      .where('block_number', '>', blockNumber)
      .delete()
    return a + b
  }

  async deleteAll(): Promise<number> {
    const knex = await this.knex()
    const a = await knex('user_transactions').delete()
    const b = await knex('included_forced_requests').delete()
    return a + b
  }
}

function queryWithIncluded(knex: Knex) {
  return knex('user_transactions')
    .select<RowWithIncluded[]>(
      'user_transactions.*',
      'included_forced_requests.block_number as included_block_number',
      'included_forced_requests.timestamp as included_timestamp',
      'included_forced_requests.state_update_id as included_state_update_id'
    )
    .leftJoin(
      'included_forced_requests',
      'user_transactions.transaction_hash',
      '=',
      'included_forced_requests.transaction_hash'
    )
}

function toRecords<T extends UserTransactionData['type']>(
  rows: RowWithIncluded[]
) {
  return rows.map((row) => toRecord<T>(row))
}

function toRecord<T extends UserTransactionData['type']>(
  row: RowWithIncluded
): UserTransactionRecord<T> {
  const record: UserTransactionRecord = {
    id: row.id,
    transactionHash: Hash256(row.transaction_hash),
    starkKeyA: StarkKey(row.stark_key_a),
    starkKeyB: row.stark_key_b ? StarkKey(row.stark_key_b) : undefined,
    vaultOrPositionIdA: row.vault_or_position_id_a ?? undefined,
    vaultOrPositionIdB: row.vault_or_position_id_b ?? undefined,
    blockNumber: row.block_number,
    timestamp: Timestamp(Number(row.timestamp)),
    data: decodeUserTransactionData(row.data),
    included:
      row.included_block_number != null &&
      row.included_timestamp != null &&
      row.included_state_update_id != null
        ? {
            blockNumber: row.included_block_number,
            timestamp: Timestamp(Number(row.included_timestamp)),
            stateUpdateId: row.included_state_update_id,
          }
        : undefined,
  }
  return record as unknown as UserTransactionRecord<T>
}
