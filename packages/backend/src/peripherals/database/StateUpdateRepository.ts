import { OraclePrice } from '@explorer/encoding'
import { AssetId, Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { PriceRow, StateUpdateRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'
import {
  PositionRecord,
  toPositionRow,
  toPositionWithPricesRecord,
} from './PositionRepository'

export interface StateUpdateRecord {
  id: number
  blockNumber: number
  factHash: Hash256
  rootHash: PedersenHash
  timestamp: Timestamp
}

export interface StateUpdatePriceRecord {
  stateUpdateId: number
  assetId: AssetId
  price: bigint
}

export class StateUpdateRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.add = this.wrapAdd(this.add)
    this.findLast = this.wrapFind(this.findLast)
    this.findIdByRootHash = this.wrapFind(this.findIdByRootHash)
    this.getAll = this.wrapGet(this.getAll)
    this.getPaginated = this.wrapGet(this.getPaginated)
    this.count = this.wrapAny(this.count)
    this.findByIdWithPositions = this.wrapFind(this.findByIdWithPositions)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
  }

  async add({ stateUpdate, positions, prices }: StateUpdateBundle) {
    await this.knex.transaction(async (trx) => {
      await trx('state_updates').insert([toStateUpdateRow(stateUpdate)])

      if (positions.length > 0)
        await trx('positions').insert(
          positions.map((pos) => toPositionRow(pos, stateUpdate.id))
        )

      if (prices.length > 0)
        await trx('prices').insert(
          prices.map((price) => toPriceRow(price, stateUpdate.id))
        )
    })
    return stateUpdate.id
  }

  async findLast(): Promise<StateUpdateRecord | undefined> {
    const row = await this.knex('state_updates')
      .orderBy('block_number', 'desc')
      .first()
    return row && toStateUpdateRecord(row)
  }

  async findIdByRootHash(hash: PedersenHash): Promise<number | undefined> {
    const row = await this.knex('state_updates')
      .where('root_hash', hash.toString())
      .first('id')
    return row?.id
  }

  async getAll() {
    const rows = await this.knex('state_updates').select('*')
    return rows.map(toStateUpdateRecord)
  }

  async getPaginated({ offset, limit }: { offset: number; limit: number }) {
    interface Row {
      id: number
      root_hash: string
      timestamp: number
      position_count: bigint
    }
    const rows = (await this.knex('state_updates')
      .orderBy('timestamp', 'desc')
      .offset(offset)
      .limit(limit)
      .leftJoin('positions', 'state_updates.id', 'positions.state_update_id')
      .groupBy('root_hash', 'id', 'timestamp')
      .select(
        'id',
        'root_hash',
        'timestamp',
        this.knex.raw('count(position_id) as position_count')
      )) as Row[]

    return rows.map((row) => ({
      id: row.id,
      rootHash: PedersenHash(row.root_hash),
      timestamp: Timestamp(row.timestamp),
      positionCount: Number(row.position_count),
    }))
  }

  async count() {
    const row = await this.knex('state_updates').count()
    return BigInt(row[0].count)
  }

  async findByIdWithPositions(id: number) {
    const [update, positions] = await Promise.all([
      this.knex('state_updates').where('id', '=', id).first(),
      this.knex('positions')
        .where('positions.state_update_id', '=', id)
        .leftJoin(
          'prices',
          'prices.state_update_id',
          'positions.state_update_id'
        )
        .groupBy('positions.position_id', 'positions.state_update_id')
        .select(
          'positions.*',
          this.knex.raw('array_agg(row_to_json(prices)) as prices')
        ),
    ])

    if (!update) {
      return undefined
    }

    return {
      id,
      hash: Hash256(update.fact_hash),
      rootHash: PedersenHash(update.root_hash),
      blockNumber: update.block_number,
      timestamp: Timestamp(update.timestamp),
      positions: positions.map(toPositionWithPricesRecord),
    }
  }

  async deleteAll() {
    return this.knex('state_updates').delete()
  }

  async deleteAfter(blockNumber: number) {
    return this.knex('state_updates')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

export interface StateUpdateBundle {
  stateUpdate: StateUpdateRecord
  positions: PositionRecord[]
  prices: OraclePrice[]
}

function toStateUpdateRecord(row: StateUpdateRow): StateUpdateRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    factHash: Hash256(row.fact_hash),
    rootHash: PedersenHash(row.root_hash),
    timestamp: Timestamp(row.timestamp),
  }
}

function toStateUpdateRow(record: StateUpdateRecord): StateUpdateRow {
  return {
    id: record.id,
    block_number: record.blockNumber,
    fact_hash: record.factHash.toString(),
    root_hash: record.rootHash.toString(),
    timestamp: BigInt(Number(record.timestamp)),
  }
}

function toPriceRow(record: OraclePrice, stateUpdateId: number): PriceRow {
  return {
    state_update_id: stateUpdateId,
    asset_id: record.assetId.toString(),
    price: record.price,
  }
}
