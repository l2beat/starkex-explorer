import { Hash256, StarkKey, Timestamp } from '@explorer/types'
import { UserEventRow } from 'knex/types/tables'

import { Logger } from '../../../tools/Logger'
import { BaseRepository } from '../shared/BaseRepository'
import { Database } from '../shared/Database'
import {
  decodeUserEventData,
  encodeUserEventData,
  UserEventData,
} from './UserEvent'

export interface UserEventRecord<
  T extends UserEventData['type'] = UserEventData['type']
> {
  id: number
  transactionHash: Hash256
  starkKeyA: StarkKey
  starkKeyB?: StarkKey
  vaultOrPositionIdA?: bigint
  vaultOrPositionIdB?: bigint
  blockNumber: number
  timestamp: Timestamp
  data: Extract<UserEventData, { type: T }>
}

export class UserEventRepository extends BaseRepository {
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
    data: UserEventData
  }): Promise<number> {
    const knex = await this.knex()
    const encoded = encodeUserEventData(record.data)
    const results = await knex('user_events')
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

  async getByStarkKey<T extends UserEventData['type']>(
    starkKey: StarkKey,
    types?: T[]
  ): Promise<UserEventRecord<T>[]> {
    const knex = await this.knex()
    let query = knex('user_events')
      .where('stark_key_a', starkKey.toString())
      .orWhere('stark_key_b', starkKey.toString())
    if (types) {
      query = query.whereIn('type', types)
    }
    return toRecords<T>(await query)
  }

  async getByPositionId<T extends UserEventData['type']>(
    positionId: bigint,
    types?: T[]
  ): Promise<UserEventRecord<T>[]> {
    const knex = await this.knex()
    let query = knex('user_events')
      .where('vault_or_position_id_a', positionId)
      .orWhere('vault_or_position_id_b', positionId)
    if (types) {
      query = query.whereIn('type', types)
    }
    return toRecords<T>(await query)
  }

  async getPaginated<T extends UserEventData['type']>(options: {
    limit: number
    offset: number
    types?: T[]
  }): Promise<UserEventRecord<T>[]> {
    const knex = await this.knex()
    let query = knex('user_events').limit(options.limit).offset(options.offset)
    if (options.types) {
      query = query.whereIn('type', options.types)
    }
    return toRecords<T>(await query)
  }

  async getNotIncluded<T extends UserEventData['type']>(
    types?: T[]
  ): Promise<UserEventRecord<T>[]> {
    const knex = await this.knex()
    let query = knex('user_events')
      .select<UserEventRow[]>('user_events.*')
      .leftJoin(
        'included_forced_requests',
        'user_events.transaction_hash',
        '=',
        'included_forced_requests.transaction_hash'
      )
      .where('included_forced_requests.transaction_hash', null)
    if (types) {
      query = query.whereIn('type', types)
    }
    return toRecords<T>(await query)
  }

  async findById(id: number): Promise<UserEventRecord | undefined> {
    const knex = await this.knex()
    const result = await knex('user_events').where('id', id).first()
    return result ? toRecord(result) : undefined
  }

  async findByTransactionHash(
    hash: Hash256
  ): Promise<UserEventRecord | undefined> {
    const knex = await this.knex()
    const result = await knex('user_events')
      .where('transaction_hash', hash.toString())
      .first()
    return result ? toRecord(result) : undefined
  }

  async deleteAfter(blockNumber: number): Promise<number> {
    const knex = await this.knex()
    return knex('user_events').where('block_number', '>', blockNumber).delete()
  }

  async deleteAll(): Promise<number> {
    const knex = await this.knex()
    return knex('user_events').delete()
  }
}

function toRecords<T extends UserEventData['type']>(rows: UserEventRow[]) {
  return rows.map(toRecord) as unknown as UserEventRecord<T>[]
}

function toRecord(row: UserEventRow): UserEventRecord {
  return {
    id: row.id,
    transactionHash: Hash256(row.transaction_hash),
    starkKeyA: StarkKey(row.stark_key_a),
    starkKeyB: row.stark_key_b ? StarkKey(row.stark_key_b) : undefined,
    vaultOrPositionIdA: row.vault_or_position_id_a ?? undefined,
    vaultOrPositionIdB: row.vault_or_position_id_b ?? undefined,
    blockNumber: row.block_number,
    timestamp: Timestamp(Number(row.timestamp)),
    data: decodeUserEventData(row.data),
  }
}
