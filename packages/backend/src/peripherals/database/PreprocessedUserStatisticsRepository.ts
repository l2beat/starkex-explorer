import { StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedUserStatisticsRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PreprocessedUserStatisticsRecord {
  id: number
  stateUpdateId: number
  blockNumber: number
  timestamp: Timestamp
  starkKey: StarkKey
  assetCount: number
  balanceChangeCount: number
  prevHistoryId?: number
}

export class PreprocessedUserStatisticsRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.findCurrentByStarkKey = this.wrapFind(this.findCurrentByStarkKey)
    this.deleteByStateUpdateId = this.wrapDelete(this.deleteByStateUpdateId)
    this.deleteById = this.wrapDelete(this.deleteById)
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(
    record: Omit<PreprocessedUserStatisticsRecord, 'id'>,
    trx: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    const results = await knex('preprocessed_user_statistics')
      .insert(toPreprocessedAssetHistoryRow(record))
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async findCurrentByStarkKey(starkKey: StarkKey, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_user_statistics')
      .where('stark_key', starkKey.toString())
      .orderBy('state_update_id', 'desc')
      .first()

    if (row) return toPreprocessedAssetHistoryRecord(row)
  }

  async deleteById(id: number, trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_user_statistics').where('id', id).delete()
  }

  async deleteByStateUpdateId(stateUpdateId: number, trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_user_statistics')
      .where('state_update_id', stateUpdateId)
      .delete()
  }

  async deleteAll(trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_user_statistics').delete()
  }
}

function toPreprocessedAssetHistoryRecord(
  row: PreprocessedUserStatisticsRow
): PreprocessedUserStatisticsRecord {
  return {
    id: row.id,
    stateUpdateId: row.state_update_id,
    blockNumber: row.block_number,
    timestamp: Timestamp(row.timestamp),
    assetCount: row.asset_count,
    balanceChangeCount: row.balance_change_count,
    starkKey: StarkKey(row.stark_key),
    prevHistoryId: row.prev_history_id ?? undefined,
  }
}

function toPreprocessedAssetHistoryRow(
  record: Omit<PreprocessedUserStatisticsRecord, 'id'>
): Omit<PreprocessedUserStatisticsRow, 'id'> {
  return {
    state_update_id: record.stateUpdateId,
    block_number: record.blockNumber,
    timestamp: BigInt(record.timestamp.toString()),
    stark_key: record.starkKey.toString(),
    asset_count: record.assetCount,
    balance_change_count: record.balanceChangeCount,
    prev_history_id: record.prevHistoryId ?? null,
  }
}
