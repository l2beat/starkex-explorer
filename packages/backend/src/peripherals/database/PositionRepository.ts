import { AssetBalance } from '@explorer/encoding'
import { AssetId, EthereumAddress, StarkKey, Timestamp } from '@explorer/types'
import { AssetBalanceJson, PositionRow, PriceRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PositionRecord {
  positionId: bigint
  starkKey: StarkKey
  collateralBalance: bigint
  balances: readonly AssetBalance[]
}

export interface PositionWithPricesRecord extends PositionRecord {
  stateUpdateId: number
  prices: { assetId: AssetId; price: bigint }[]
}

export class PositionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.findById = this.wrapFind(this.findById)
    this.getHistoryById = this.wrapGet(this.getHistoryById)
    this.findById = this.wrapFind(this.findById)
    this.findIdByStarkKey = this.wrapFind(this.findIdByStarkKey)
    this.findIdByEthereumAddress = this.wrapFind(this.findIdByEthereumAddress)
    this.getPreviousStates = this.wrapGet(this.getPreviousStates)
    this.count = this.wrapAny(this.count)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async findById(positionId: bigint) {
    const knex = await this.knex()
    const row = await knex('positions')
      .where('position_id', positionId)
      .orderBy('state_update_id', 'desc')
      .first()

    if (row) return toPositionRecord(row)
  }

  async getHistoryById(positionId: bigint) {
    const knex = await this.knex()
    const rows = await knex('positions')
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
        knex.raw('array_agg(row_to_json(prices)) as prices')
      )

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return rows.map((r) => {
      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ...toPositionWithPricesRecord(r),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        timestamp: Timestamp(r.timestamp),
      }
    })
  }

  async findByIdWithPrices(id: bigint) {
    const knex = await this.knex()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const row = await knex('positions')
      .where('position_id', id)
      .orderBy('positions.state_update_id', 'desc')
      .join('prices', 'prices.state_update_id', 'positions.state_update_id')
      .groupBy('positions.position_id', 'positions.state_update_id')
      .first(
        'positions.*',
        knex.raw('array_agg(row_to_json(prices)) as prices')
      )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return row ? toPositionWithPricesRecord(row) : undefined
  }

  async findIdByStarkKey(starkKey: StarkKey): Promise<bigint | undefined> {
    const knex = await this.knex()
    const row = await knex('positions')
      .where('stark_key', starkKey.toString())
      .first('position_id')
    return row?.position_id
  }

  async findIdByEthereumAddress(
    address: EthereumAddress
  ): Promise<bigint | undefined> {
    const knex = await this.knex()
    const row = await knex('user_registration_events')
      .first('position_id')
      .orderBy('block_number', 'desc')
      .where('eth_address', address.toString())
      .join('positions', function () {
        this.on(
          'positions.stark_key',
          '=',
          'user_registration_events.stark_key'
        )
      })
    return row?.position_id
  }

  async getPreviousStates(positionIds: bigint[], stateUpdateId: number) {
    const knex = await this.knex()
    const rows = await knex
      .select('p1.*', knex.raw('array_agg(row_to_json(prices)) as prices'))
      .from('positions as p1')
      .innerJoin(
        knex
          .select(
            'position_id',
            knex.raw('max(state_update_id) as prev_state_update_id')
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

  async count() {
    const knex = await this.knex()
    const [{ count }] = await knex('positions').countDistinct({
      count: 'position_id',
    })
    return count ? BigInt(count) : 0n
  }
}

export function toPositionRecord(
  row: PositionRow
): PositionRecord & { stateUpdateId: number } {
  return {
    stateUpdateId: row.state_update_id,
    positionId: BigInt(row.position_id),
    starkKey: StarkKey(row.stark_key),
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

export function toPositionWithPricesRecord(
  row: PositionRow & { prices: PriceRow[] }
): PositionWithPricesRecord {
  return {
    ...toPositionRecord(row),
    prices: row.prices.filter(Boolean).map((p) => ({
      assetId: AssetId(p.asset_id),
      price: BigInt(p.price),
    })),
  }
}

export function toPositionRow(
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
    stark_key: record.starkKey.toString(),
    collateral_balance: record.collateralBalance,
    balances: JSON.stringify(balances),
  }
}
