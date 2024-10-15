import { AssetId } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { PriceRow } from 'knex/types/tables'

import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PricesRecord {
  stateUpdateId: number
  assetId: AssetId
  price: bigint
}

export class PricesRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    this.getAllLatest = this.wrapGet(this.getAllLatest)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: PricesRecord): Promise<number> {
    const knex = await this.knex()
    const results = await knex('prices')
      .insert(toPriceRow(record))
      .returning('state_update_id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.state_update_id
  }

  async getAllLatest() {
    const knex = await this.knex()

    const rows = await knex('prices')
      .select('*')
      .innerJoin(
        knex('prices')
          .max('state_update_id as max_state_update_id')
          .as('latest_prices'),
        (join) => {
          join.on(
            'prices.state_update_id',
            '=',
            'latest_prices.max_state_update_id'
          )
        }
      )

    return rows.map(toPricesRecord)
  }

  async deleteAll() {
    const knex = await this.knex()
    return await knex('prices').delete()
  }
}

function toPricesRecord(row: PriceRow): PricesRecord {
  return {
    stateUpdateId: row.state_update_id,
    assetId: AssetId(row.asset_id),
    price: BigInt(row.price),
  }
}

function toPriceRow(record: PricesRecord): PriceRow {
  return {
    state_update_id: record.stateUpdateId,
    asset_id: record.assetId.toString(),
    price: record.price,
  }
}
