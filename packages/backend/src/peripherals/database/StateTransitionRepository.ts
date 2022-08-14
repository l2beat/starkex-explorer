import { Hash256 } from '@explorer/types'
import { StateTransitionFactRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface StateTransitionFactRecord {
  id: number
  blockNumber: number
  hash: Hash256
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

  async addMany(records: Omit<StateTransitionFactRecord, 'id'>[]) {
    const rows = records.map(toRow)
    const knex = await this.knex()
    const ids = await knex('state_transition_facts')
      .insert(rows)
      .returning('id')
    return ids.map((x) => x.id)
  }

  async getAll() {
    const knex = await this.knex()
    const rows = await knex('state_transition_facts')
      .select('*')
      .orderBy('block_number')
    return rows.map(toRecord)
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('state_transition_facts').delete()
  }

  async deleteAfter(blockNumber: number) {
    const knex = await this.knex()
    return knex('state_transition_facts')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

function toRow(
  record: Omit<StateTransitionFactRecord, 'id'>
): Omit<StateTransitionFactRow, 'id'> {
  return {
    block_number: record.blockNumber,
    hash: record.hash.toString(),
  }
}

function toRecord(row: StateTransitionFactRow): StateTransitionFactRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    hash: Hash256(row.hash),
  }
}
