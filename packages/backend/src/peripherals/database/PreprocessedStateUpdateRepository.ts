import { Hash256 } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedStateUpdateRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PreprocessedStateUpdateRecord {
  stateUpdateId: number
  stateTransitionHash: Hash256
}

export class PreprocessedStateUpdateRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    this.findLast = this.wrapFind(this.findLast)
    this.deleteAll = this.wrapDelete(this.deleteAll)
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

  async deleteAll() {
    const knex = await this.knex()
    return knex('preprocessed_state_updates').delete()
  }
}

function toPreprocessedStateUpdateRecord(
  row: PreprocessedStateUpdateRow
): PreprocessedStateUpdateRecord {
  return {
    stateUpdateId: row.state_update_id,
    stateTransitionHash: Hash256(row.state_transition_hash),
  }
}

function toPreprocessedStateUpdateRow(
  record: PreprocessedStateUpdateRecord
): PreprocessedStateUpdateRow {
  return {
    state_update_id: record.stateUpdateId,
    state_transition_hash: record.stateTransitionHash.toString(),
  }
}
