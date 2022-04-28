import { AssetBalance, OraclePrice } from '@explorer/encoding'
import { AssetId, Hash256, PedersenHash, Timestamp } from '@explorer/types'
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
  timestamp: Timestamp
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
      .where('position_id', positionId)
      .orderBy('positions.state_update_id', 'desc')
      .join('prices', 'prices.state_update_id', 'positions.state_update_id')
      .join('state_updates', 'state_updates.id', 'positions.state_update_id')
      .groupBy(
        'positions.position_id',
        'positions.state_update_id',
        'state_updates.timestamp'
      )
      .select(
        'positions.*',
        'state_updates.timestamp as timestamp',
        this.knex.raw('array_agg(row_to_json(prices)) as prices')
      )

    return rows.map((r) => {
      return {
        ...toPositionWithPricesRecord(r),
        timestamp: Timestamp(r.timestamp),
      }
    })
  }

  async getPositionIdByRootHash(hash: Hash256): Promise<bigint | undefined> {
    const rows = await this.knex('state_updates')
      .where('root_hash', hash.slice(2))
      .select('state_updates.id as id')

    return rows[0]?.id
  }

  async getPositionIdByPublicKey(
    publicKey: string
  ): Promise<bigint | undefined> {
    const rows = await this.knex('positions')
      .where('public_key', publicKey)
      .select('positions.position_id as id')

    return rows[0]?.id
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

  async countPositions() {
    const [{ count }] = await this.knex('positions').countDistinct({
      count: 'position_id',
    })
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

function toPositionWithPricesRecord(
  row: PositionRow & { prices: PriceRow[] }
): PositionRecord & {
  stateUpdateId: number
  prices: { assetId: AssetId; price: bigint }[]
} {
  return {
    ...toPositionRecord(row),
    prices: row.prices.filter(Boolean).map((p) => ({
      assetId: AssetId(p.asset_id),
      price: BigInt(p.price),
    })),
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
