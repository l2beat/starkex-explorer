import { AssetBalance } from '@explorer/encoding'
import { AssetId, EthereumAddress, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { AssetBalanceJson, PositionRow, PriceRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export interface PositionRecord {
  positionId: bigint
  publicKey: StarkKey
  collateralBalance: bigint
  balances: readonly AssetBalance[]
}

export interface PositionWithPricesRecord extends PositionRecord {
  stateUpdateId: number
  prices: { assetId: AssetId; price: bigint }[]
}

export class PositionRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.getHistoryById = this.wrapGet(this.getHistoryById)
    this.findById = this.wrapFind(this.findById)
    this.findIdByPublicKey = this.wrapFind(this.findIdByPublicKey)
    this.findIdByEthereumAddress = this.wrapFind(this.findIdByEthereumAddress)
    this.getPreviousStates = this.wrapGet(this.getPreviousStates)
    this.count = this.wrapAny(this.count)
  }

  async getHistoryById(positionId: bigint) {
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

  async findById(id: bigint) {
    const row = await this.knex('positions')
      .where('position_id', id)
      .orderBy('positions.state_update_id', 'desc')
      .join('prices', 'prices.state_update_id', 'positions.state_update_id')
      .groupBy('positions.position_id', 'positions.state_update_id')
      .first(
        'positions.*',
        this.knex.raw('array_agg(row_to_json(prices)) as prices')
      )
    return row ? toPositionWithPricesRecord(row) : undefined
  }

  async findIdByPublicKey(publicKey: StarkKey): Promise<bigint | undefined> {
    const row = await this.knex('positions')
      .where('public_key', publicKey.toString())
      .first('position_id')
    return row?.position_id
  }

  async findIdByEthereumAddress(
    address: EthereumAddress
  ): Promise<bigint | undefined> {
    const row = await this.knex('user_registration_events')
      .first('position_id')
      .orderBy('block_number', 'desc')
      .where('eth_address', address.toString())
      .join('positions', function () {
        this.on(
          'positions.public_key',
          '=',
          'user_registration_events.stark_key'
        )
      })
    return row?.position_id
  }

  async getPreviousStates(positionIds: bigint[], stateUpdateId: number) {
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

  async count() {
    const [{ count }] = await this.knex('positions').countDistinct({
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
    publicKey: StarkKey(row.public_key),
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
    public_key: record.publicKey.toString(),
    collateral_balance: record.collateralBalance,
    balances: JSON.stringify(balances),
  }
}
