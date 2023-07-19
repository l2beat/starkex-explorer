import { StarkKey } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedUserL2TransactionsStatisticsRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { PreprocessedUserL2TransactionsStatistics } from './PreprocessedL2TransactionsStatistics'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PreprocessedUserL2TransactionsStatisticsRecord {
  id: number
  stateUpdateId: number
  starkKey: StarkKey
  l2TransactionsStatistics: PreprocessedUserL2TransactionsStatistics
  cumulativeL2TransactionsStatistics: PreprocessedUserL2TransactionsStatistics
}

export class PreprocessedUserL2TransactionsStatisticsRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)
    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    this.findLast = this.wrapFind(this.findLast)
    this.findCurrentByStarkKey = this.wrapFind(this.findCurrentByStarkKey)
    this.deleteByStateUpdateId = this.wrapDelete(this.deleteByStateUpdateId)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(
    record: Omit<PreprocessedUserL2TransactionsStatisticsRecord, 'id'>,
    trx: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    const results = await knex('preprocessed_user_l2_transactions_statistics')
      .insert(toPreprocessedUserL2TransactionsStatisticsRow(record))
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async findLast(trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_user_l2_transactions_statistics')
      .orderBy('state_update_id', 'desc')
      .first()

    return row
      ? toPreprocessedUserL2TransactionsStatisticsRecord(row)
      : undefined
  }

  async findCurrentByStarkKey(starkKey: StarkKey, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_user_l2_transactions_statistics')
      .where('stark_key', starkKey.toString())
      .orderBy('state_update_id', 'desc')
      .first()

    return row
      ? toPreprocessedUserL2TransactionsStatisticsRecord(row)
      : undefined
  }

  async deleteByStateUpdateId(stateUpdateId: number, trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_user_l2_transactions_statistics')
      .where('state_update_id', stateUpdateId)
      .delete()
  }

  async deleteAll(trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_user_l2_transactions_statistics').delete()
  }
}

function toPreprocessedUserL2TransactionsStatisticsRecord(
  row: PreprocessedUserL2TransactionsStatisticsRow
): PreprocessedUserL2TransactionsStatisticsRecord {
  return {
    id: row.id,
    stateUpdateId: row.state_update_id,
    starkKey: StarkKey(row.stark_key),
    l2TransactionsStatistics: row.l2_transactions_statistics,
    cumulativeL2TransactionsStatistics:
      row.cumulative_l2_transactions_statistics,
  }
}

function toPreprocessedUserL2TransactionsStatisticsRow(
  record: Omit<PreprocessedUserL2TransactionsStatisticsRecord, 'id'>
): Omit<PreprocessedUserL2TransactionsStatisticsRow, 'id'> {
  return {
    state_update_id: record.stateUpdateId,
    stark_key: record.starkKey.toString(),
    l2_transactions_statistics: record.l2TransactionsStatistics,
    cumulative_l2_transactions_statistics:
      record.cumulativeL2TransactionsStatistics,
  }
}
