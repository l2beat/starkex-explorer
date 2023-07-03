import { Hash256 } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedStateUpdateRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PreprocessedStateUpdateRecord {
  stateUpdateId: number
  stateTransitionHash: Hash256
  l2TransactionCount?: number
  l2ReplacedTransactionCount?: number
  l2MultiTransactionCount?: number
}

export class PreprocessedStateUpdateRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    this.findLast = this.wrapFind(this.findLast)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteByStateUpdateId = this.wrapDelete(this.deleteByStateUpdateId)
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async findLast(
    trx?: Knex.Transaction
  ): Promise<PreprocessedStateUpdateRecord | undefined> {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_state_updates')
      .orderBy('state_update_id', 'desc')
      .first()
    return row && toPreprocessedStateUpdateRecord(row)
  }

  async add(
    row: PreprocessedStateUpdateRecord,
    trx?: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    await knex('preprocessed_state_updates').insert(
      toPreprocessedStateUpdateRow(row)
    )
    return row.stateUpdateId
  }

  async deleteAll(trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_state_updates').delete()
  }

  async deleteByStateUpdateId(stateUpdateId: number, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_state_updates')
      .where('state_update_id', stateUpdateId)
      .delete()
  }
}

function toPreprocessedStateUpdateRecord(
  row: PreprocessedStateUpdateRow
): PreprocessedStateUpdateRecord {
  return {
    stateUpdateId: row.state_update_id,
    stateTransitionHash: Hash256(row.state_transition_hash),
    l2TransactionCount: row.l2_transaction_count ?? undefined,
    l2ReplacedTransactionCount: row.l2_replaced_transaction_count ?? undefined,
    l2MultiTransactionCount: row.l2_multi_transaction_count ?? undefined,
  }
}

function toPreprocessedStateUpdateRow(
  record: PreprocessedStateUpdateRecord
): PreprocessedStateUpdateRow {
  return {
    state_update_id: record.stateUpdateId,
    state_transition_hash: record.stateTransitionHash.toString(),
    l2_transaction_count: record.l2TransactionCount ?? null,
    l2_replaced_transaction_count: record.l2ReplacedTransactionCount ?? null,
    l2_multi_transaction_count: record.l2MultiTransactionCount ?? null,
  }
}
