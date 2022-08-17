import { Hash256 } from '@explorer/types'
import { StateTransitionRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface StateTransitionRecord {
  id: number
  blockNumber: number
  stateTransitionHash: Hash256
}

export class StateTransitionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addMany(records: Omit<StateTransitionRecord, 'id'>[]) {
    const rows = records.map(toRow)
    const knex = await this.knex()
    const ids = await knex('state_transitions').insert(rows).returning('id')
    return ids.map((x) => x.id)
  }

  async getAll() {
    const knex = await this.knex()
    const rows = await knex('state_transitions')
      .select('*')
      .orderBy('block_number')
    return rows.map(toRecord)
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('state_transitions').delete()
  }

  async deleteAfter(blockNumber: number) {
    const knex = await this.knex()
    return knex('state_transitions')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

function toRow(
  record: Omit<StateTransitionRecord, 'id'>
): Omit<StateTransitionRow, 'id'> {
  return {
    block_number: record.blockNumber,
    state_transition_hash: record.stateTransitionHash.toString(),
  }
}

function toRecord(row: StateTransitionRow): StateTransitionRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    stateTransitionHash: Hash256(row.state_transition_hash),
  }
}
