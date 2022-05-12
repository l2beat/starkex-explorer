import { Hash256 } from '@explorer/types'
import { Knex } from 'knex'
import { StateTransitionFactRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export interface StateTransitionFactRecord {
  id: number
  blockNumber: number
  hash: Hash256
}

export class StateTransitionFactRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
  }

  async addMany(records: Omit<StateTransitionFactRecord, 'id'>[]) {
    const rows = records.map(toRow)
    return this.knex('state_transition_facts').insert(rows).returning('id')
  }

  async getAll() {
    const rows = await this.knex('state_transition_facts')
      .select('*')
      .orderBy('block_number')
    return rows.map(toRecord)
  }

  async deleteAll() {
    return this.knex('state_transition_facts').delete()
  }

  async deleteAfter(blockNumber: number) {
    return this.knex('state_transition_facts')
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
