import { StarkKey } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedAssetHistoryRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export class PreprocessedAssetHistoryRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.addMany = this.wrapAddMany(this.addMany)
    this.getCurrentByStarkKeyAndTokenIds = this.wrapGet(
      this.getCurrentByStarkKeyAndTokenIds
    )
    this.getCurrentNonEmptyByStarkKey = this.wrapGet(
      this.getCurrentNonEmptyByStarkKey
    )
    this.unsetCurrentByStarkKeyAndTokenIds = this.wrapUpdate(
      this.unsetCurrentByStarkKeyAndTokenIds
    )

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(
    row: Omit<PreprocessedAssetHistoryRow, 'id'>,
    trx?: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    await knex('preprocessed_asset_history').insert(row)
    return row.state_update_id
  }

  async addMany(
    rows: Omit<PreprocessedAssetHistoryRow, 'id'>[],
    trx?: Knex.Transaction
  ) {
    throw new Error(
      "This method doesn't respect trascation! Don't use until reviewed!"
    )
    const knex = await this.knex(trx)
    const ids = await knex('preprocessed_asset_history')
      .insert(rows)
      .returning('id')
    return ids.map((x) => x.id)
  }

  async getCurrentNonEmptyByStarkKey(
    starkKey: StarkKey,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where({
        stark_key: starkKey.toString(),
        is_current: true,
      })
      .andWhere('balance', '!=', 0)
    return rows
  }

  async getCurrentByStarkKeyAndTokenIds(
    starkKey: StarkKey,
    tokenIds: string[],
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where({
        stark_key: starkKey.toString(),
        is_current: true,
      })
      .whereIn('token', tokenIds)
      .andWhere('balance', '!=', 0)

    return rows
  }

  async unsetCurrentByStarkKeyAndTokenIds(
    starkKey: StarkKey,
    tokenIds: string[],
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const updates = await knex('preprocessed_asset_history')
      .update('is_current', false)
      .where({
        stark_key: starkKey.toString(),
        is_current: true,
      })
      .whereIn('token', tokenIds)

    return updates
  }
}
