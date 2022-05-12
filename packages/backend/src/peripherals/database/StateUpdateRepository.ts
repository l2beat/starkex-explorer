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
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toStateUpdateRecord)
  }

  async getStateUpdateList({
    offset,
    limit,
  }: {
    offset: number
    limit: number
  }) {
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
      )) as unknown as Array<{
      id: number
      root_hash: string
      timestamp: number
      position_count: bigint
    }>

    this.logger.debug({ method: 'getStateUpdateList', rows: rows.length })

    return rows.map((row) => ({
      id: row.id,
      rootHash: PedersenHash(row.root_hash),
      timestamp: Timestamp(row.timestamp),
      positionCount: Number(row.position_count),
    }))
  }

  async getStateUpdateCount() {
    const row = await this.knex('state_updates').count()
    return row[0].count as unknown as bigint
  }

  async getStateUpdateById(id: number) {
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

  async getPositionsPreviousState(
    positionIds: bigint[],
    stateUpdateId: number
  ) {
    const rows = await this.knex
      .select('p1.*', this.knex.raw('array_agg(row_to_json(prices)) as prices'))
      .from('positions as p1')
      .innerJoin(
        this.knex
          .select(
            'position_id',
            this.knex.raw('max(state_update_id) as prev_state_update_id')
          )
          .from('positions')
          .as('p2')
          .whereIn('position_id', positionIds)
          .andWhere('state_update_id', '<', stateUpdateId)
          .groupBy('position_id'),
        function () {
          return this.on('p1.position_id', '=', 'p2.position_id').andOn(
            'p1.state_update_id',
            '=',
            'p2.prev_state_update_id'
          )
        }
      )
      .innerJoin('prices', 'prices.state_update_id', 'p1.state_update_id')
      .groupBy('p1.state_update_id', 'p1.position_id')

    return rows.map(toPositionWithPricesRecord)
  }

  async deleteAll() {
    await this.knex('state_updates').delete()

    this.logger.debug({ method: 'deleteAll' })
  }

  async deleteAllAfter(blockNumber: number) {
    const rowsCount = await this.knex('state_updates')
      .where('block_number', '>', blockNumber)
      .delete()
    this.logger.debug({ method: 'deleteAllAfter', rows: rowsCount })
  }

  async countStateUpdates() {
    const [{ count }] = await this.knex('state_updates').count({ count: '*' })
    return count ? BigInt(count) : 0n
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
