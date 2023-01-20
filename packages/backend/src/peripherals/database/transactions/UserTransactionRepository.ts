import { Hash256, StarkKey, Timestamp } from '@explorer/types'
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
  data: Extract<UserTransactionData, { type: T }>
}

export class UserTransactionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.getByStarkKey = this.wrapGet(this.getByStarkKey)
    this.getByPositionId = this.wrapGet(this.getByPositionId)
    this.getPaginated = this.wrapGet(this.getPaginated)
    this.getNotIncluded = this.wrapGet(this.getNotIncluded)
    this.findById = this.wrapFind(this.findById)
    this.findByTransactionHash = this.wrapFind(this.findByTransactionHash)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: {
    hash: Hash256
    blockNumber: number
    timestamp: Timestamp
    data: UserTransactionData
  }): Promise<number> {
    const knex = await this.knex()
    const encoded = encodeUserTransactionData(record.data)
    const results = await knex('user_transactions')
      .insert({
        transaction_hash: record.hash.toString(),
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

  async getByStarkKey<T extends UserTransactionData['type']>(
    starkKey: StarkKey,
    types?: T[]
  ): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = knex('user_transactions')
      .where('stark_key_a', starkKey.toString())
      .orWhere('stark_key_b', starkKey.toString())
    if (types) {
      query = query.whereIn('type', types)
    }
    return toRecords<T>(await query)
  }

  async getByPositionId<T extends UserTransactionData['type']>(
    positionId: bigint,
    types?: T[]
  ): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = knex('user_transactions')
      .where('vault_or_position_id_a', positionId)
      .orWhere('vault_or_position_id_b', positionId)
    if (types) {
      query = query.whereIn('type', types)
    }
    return toRecords<T>(await query)
  }

  async getPaginated<T extends UserTransactionData['type']>(options: {
    limit: number
    offset: number
    types?: T[]
  }): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = knex('user_transactions')
      .limit(options.limit)
      .offset(options.offset)
    if (options.types) {
      query = query.whereIn('type', options.types)
    }
    return toRecords<T>(await query)
  }

  async getNotIncluded<T extends UserTransactionData['type']>(
    types?: T[]
  ): Promise<UserTransactionRecord<T>[]> {
    const knex = await this.knex()
    let query = knex('user_transactions')
      .select<UserTransactionRow[]>('user_transactions.*')
      .leftJoin(
        'included_forced_requests',
        'user_transactions.transaction_hash',
        '=',
        'included_forced_requests.transaction_hash'
      )
      .where('included_forced_requests.transaction_hash', null)
    if (types) {
      query = query.whereIn('type', types)
    }
    return toRecords<T>(await query)
  }

  async findById(id: number): Promise<UserTransactionRecord | undefined> {
    const knex = await this.knex()
    const result = await knex('user_transactions').where('id', id).first()
    return result ? toRecord(result) : undefined
  }

  async findByTransactionHash(
    hash: Hash256
  ): Promise<UserTransactionRecord | undefined> {
    const knex = await this.knex()
    const result = await knex('user_transactions')
      .where('transaction_hash', hash.toString())
      .first()
    return result ? toRecord(result) : undefined
  }

  async deleteAfter(blockNumber: number): Promise<number> {
    const knex = await this.knex()
    return knex('user_transactions')
      .where('block_number', '>', blockNumber)
      .delete()
  }

  async deleteAll(): Promise<number> {
    const knex = await this.knex()
    return knex('user_transactions').delete()
  }
}

function toRecords<T extends UserTransactionData['type']>(
  rows: UserTransactionRow[]
) {
  return rows.map(toRecord) as unknown as UserTransactionRecord<T>[]
}

function toRecord(row: UserTransactionRow): UserTransactionRecord {
  return {
    id: row.id,
    transactionHash: Hash256(row.transaction_hash),
    starkKeyA: StarkKey(row.stark_key_a),
    starkKeyB: row.stark_key_b ? StarkKey(row.stark_key_b) : undefined,
    vaultOrPositionIdA: row.vault_or_position_id_a ?? undefined,
    vaultOrPositionIdB: row.vault_or_position_id_b ?? undefined,
    blockNumber: row.block_number,
    timestamp: Timestamp(Number(row.timestamp)),
    data: decodeUserTransactionData(row.data),
  }
}
