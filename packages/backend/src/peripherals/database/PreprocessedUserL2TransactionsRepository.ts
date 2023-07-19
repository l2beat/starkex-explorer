import { StarkKey } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedUserL2TransactionsRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { PreprocessedUserL2TransactionsStatistics } from './PreprocessedL2TransactionsStatistics'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PreprocessedUserL2TransactionsRecord {
  id: number
  stateUpdateId: number
  starkKey: StarkKey
  l2TransactionsStatistics: PreprocessedUserL2TransactionsStatistics
  cumulativeL2TransactionsStatistics: PreprocessedUserL2TransactionsStatistics
}

export class PreprocessedUserL2TransactionsRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)
    this.add = this.wrapAdd(this.add)
    this.findLast = this.wrapFind(this.findLast)
    this.findCurrentByStarkKey = this.wrapFind(this.findCurrentByStarkKey)
    this.deleteByStateUpdateId = this.wrapDelete(this.deleteByStateUpdateId)
    this.deleteAll = this.wrapDelete(this.deleteAll)
  }

  async add(
    record: Omit<PreprocessedUserL2TransactionsRecord, 'id'>,
    trx: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    const results = await knex('preprocessed_user_l2_transactions')
      .insert(toPreprocessedUserL2TransactionsRow(record))
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async findLast(trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_user_l2_transactions')
      .orderBy('state_update_id', 'desc')
      .first()

    return row ? toPreprocessedUserL2TransactionsRecord(row) : undefined
  }

  async findCurrentByStarkKey(starkKey: StarkKey, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_user_l2_transactions')
      .where('stark_key', starkKey.toString())
      .orderBy('state_update_id', 'desc')
      .first()

    return row ? toPreprocessedUserL2TransactionsRecord(row) : undefined
  }

  async deleteByStateUpdateId(stateUpdateId: number, trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_user_l2_transactions')
      .where('state_update_id', stateUpdateId)
      .delete()
  }

  async deleteAll(trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_user_l2_transactions').delete()
  }
}

function toPreprocessedUserL2TransactionsRecord(
  row: PreprocessedUserL2TransactionsRow
): PreprocessedUserL2TransactionsRecord {
  return {
    id: row.id,
    stateUpdateId: row.state_update_id,
    starkKey: StarkKey(row.stark_key),
    l2TransactionsStatistics: row.l2_transactions_statistics,
    cumulativeL2TransactionsStatistics:
      row.cumulative_l2_transactions_statistics,
  }
}

function toPreprocessedUserL2TransactionsRow(
  record: Omit<PreprocessedUserL2TransactionsRecord, 'id'>
): Omit<PreprocessedUserL2TransactionsRow, 'id'> {
  return {
    state_update_id: record.stateUpdateId,
    stark_key: record.starkKey.toString(),
    l2_transactions_statistics: record.l2TransactionsStatistics,
    cumulative_l2_transactions_statistics:
      record.cumulativeL2TransactionsStatistics,
  }
}
