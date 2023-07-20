import { Hash256 } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { PageMappingRow } from 'knex/types/tables'

import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PageMappingRecord {
  id: number
  blockNumber: number
  stateTransitionHash: Hash256
  pageHash: Hash256
  pageIndex: number
}

export class PageMappingRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAllAfter = this.wrapDelete(this.deleteAllAfter)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addMany(records: Omit<PageMappingRecord, 'id'>[]) {
    const rows = records.map(toRow)
    const knex = await this.knex()
    const ids = await knex('page_mappings').insert(rows).returning('id')
    return ids.map((x) => x.id)
  }

  async getAll() {
    const knex = await this.knex()
    const rows = await knex('page_mappings').select('*')
    return rows.map(toRecord)
  }

  async deleteAll() {
    const knex = await this.knex()
    return await knex('page_mappings').delete()
  }

  async deleteAllAfter(blockNumber: number) {
    const knex = await this.knex()
    return await knex('page_mappings')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

function toRow(
  record: Omit<PageMappingRecord, 'id'>
): Omit<PageMappingRow, 'id'> {
  return {
    block_number: record.blockNumber,
    state_transition_hash: record.stateTransitionHash.toString(),
    page_hash: record.pageHash.toString(),
    page_index: record.pageIndex,
  }
}

function toRecord(row: PageMappingRow): PageMappingRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    stateTransitionHash: Hash256(row.state_transition_hash),
    pageHash: Hash256(row.page_hash),
    pageIndex: row.page_index,
  }
}
