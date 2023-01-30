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

    this.clearCurrentByStarkKeyAndTokenId = this.wrapUpdateReturning(
      this.clearCurrentByStarkKeyAndTokenId
    )
    this.clearCurrentByPositionOrVaultId = this.wrapUpdateReturning(
      this.clearCurrentByPositionOrVaultId
    )
    this.add = this.wrapAdd(this.add)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async clearCurrentByStarkKeyAndTokenId(
    starkKey: StarkKey,
    tokenId: string,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_asset_history')
      .where({
        stark_key: starkKey.toString(),
        token: tokenId,
        is_current: true,
      })
      .update({
        is_current: false,
      })
      .returning(['id', 'balance'])

    return row[0]
  }

  async clearCurrentByPositionOrVaultId(
    positionOrVaultId: bigint,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where('position_or_vault_id', positionOrVaultId)
      .andWhere('is_current', true)
      .andWhere('balance', '!=', 0)
      .update({
        is_current: false,
      })
      .returning('*')

    return rows
  }

  async add(
    row: Omit<PreprocessedAssetHistoryRow, 'id'>,
    trx?: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    await knex('preprocessed_asset_history').insert(row)
    return row.state_update_id
  }
}
