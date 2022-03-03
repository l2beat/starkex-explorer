import { AssetBalance, OraclePrice } from '@explorer/encoding'
import { AssetId, Hash256, PedersenHash } from '@explorer/types'
import { Knex } from 'knex'
import {
  AssetBalanceJson,
  PositionRow,
  PriceRow,
  StateUpdateRow,
} from 'knex/types/tables'

import { Logger } from '../../tools/Logger'

export interface StateUpdateRecord {
  id: number
  blockNumber: number
  factHash: Hash256
  rootHash: PedersenHash
  timestamp: number
}

export interface PositionRecord {
  positionId: bigint
  publicKey: string
  collateralBalance: bigint
  balances: readonly AssetBalance[]
}

export interface StateUpdatePriceRecord {
  stateUpdateId: number
  assetId: AssetId
  price: bigint
}

export class StateUpdateRepository {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
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

      this.logger.debug({
        method: 'add',
        id: stateUpdate.id,
        blockNumber: stateUpdate.blockNumber,
      })
    })
  }

  async getLast(): Promise<StateUpdateRecord | undefined> {
    const row = await this.knex('state_updates')
      .orderBy('block_number', 'desc')
      .first()

    this.logger.debug({ method: 'getLast', id: row?.id || null })

    return row && toStateUpdateRecord(row)
  }

  async getPositionHistoryById(positionId: bigint) {
    const rows = await this.knex('positions')
      .select('*')
      .where('position_id', positionId)
      .orderBy('state_update_id', 'desc')

    return rows.map(toPositionRecord)
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
      .join('positions', 'state_updates.id', 'positions.state_update_id')
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
      timestamp: row.timestamp,
      positionCount: Number(row.position_count),
    }))
  }

  async getLatestAssetPrices() {
    const rows = await this.knex('prices as p1').innerJoin(
      this.knex('prices')
        .select(
          'asset_id',
          this.knex.raw('max(state_update_id) as state_update_id')
        )
        .groupBy('asset_id')
        .as('p2'),
      function () {
        this.on('p1.asset_id', '=', 'p2.asset_id').andOn(
          'p1.state_update_id',
          '=',
          'p2.state_update_id'
        )
      }
    )
    return rows.map(toStateUpdatePriceRecord)
  }

  async getStateUpdateCount() {
    const row = await this.knex('state_updates').count()
    return row[0].count as unknown as bigint
  }

  async getStateUpdateById(id: number) {
    const row = (await this.knex('state_updates')
      .first()
      .where('id', '=', id)
      .orderBy('timestamp', 'desc')
      .join('positions', 'state_updates.id', 'positions.state_update_id')
      .groupBy('root_hash', 'timestamp')
      .select(
        'timestamp',
        'root_hash',
        this.knex.raw('ARRAY_AGG(row_to_json(positions)) as positions')
      )) as unknown as
      | {
          timestamp: number
          root_hash: string
          positions: PositionRow[]
        }
      | undefined

    this.logger.debug({ method: 'getStateUpdateById', id })

    return (
      row && {
        id,
        hash: PedersenHash(row.root_hash),
        timestamp: row.timestamp,
        positions: row.positions.map(toPositionRecord),
      }
    )
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
    timestamp: row.timestamp,
  }
}

function toStateUpdateRow(record: StateUpdateRecord): StateUpdateRow {
  return {
    id: record.id,
    block_number: record.blockNumber,
    fact_hash: record.factHash.toString(),
    root_hash: record.rootHash.toString(),
    timestamp: record.timestamp,
  }
}

function toPositionRecord(
  row: PositionRow
): PositionRecord & { stateUpdateId: number } {
  return {
    stateUpdateId: row.state_update_id,
    positionId: BigInt(row.position_id),
    publicKey: row.public_key,
    collateralBalance: BigInt(row.collateral_balance),
    balances: (typeof row.balances === 'string'
      ? (JSON.parse(row.balances) as AssetBalanceJson[])
      : row.balances
    ).map((x) => ({
      assetId: AssetId(x.asset_id),
      balance: BigInt(x.balance),
    })),
  }
}

function toStateUpdatePriceRecord(row: PriceRow): StateUpdatePriceRecord {
  return {
    stateUpdateId: row.state_update_id,
    assetId: AssetId(row.asset_id),
    price: row.price,
  }
}

function toPositionRow(
  record: PositionRecord,
  stateUpdateId: number
): PositionRow {
  const balances = record.balances.map(
    (x): AssetBalanceJson => ({
      asset_id: x.assetId.toString(),
      balance: x.balance.toString(),
    })
  )

  return {
    state_update_id: stateUpdateId,
    position_id: record.positionId,
    public_key: record.publicKey,
    collateral_balance: record.collateralBalance,
    balances: JSON.stringify(balances),
  }
}

function toPriceRow(record: OraclePrice, stateUpdateId: number): PriceRow {
  return {
    state_update_id: stateUpdateId,
    asset_id: record.assetId.toString(),
    price: record.price,
  }
}
