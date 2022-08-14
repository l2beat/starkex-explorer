import { Hash256 } from '@explorer/types'
import { FactToPageRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface FactToPageRecord {
  id: number
  blockNumber: number
  stateTransitionHash: Hash256
  pageHash: Hash256
  index: number
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

  async addMany(records: Omit<FactToPageRecord, 'id'>[]) {
    const rows = records.map(toRow)
    const knex = await this.knex()
    const ids = await knex('fact_to_pages').insert(rows).returning('id')
    return ids.map((x) => x.id)
  }

  async getAll() {
    const knex = await this.knex()
    const rows = await knex('fact_to_pages').select('*')
    return rows.map(toRecord)
  }

  async deleteAll() {
    const knex = await this.knex()
    return await knex('fact_to_pages').delete()
  }

  async deleteAllAfter(blockNumber: number) {
    const knex = await this.knex()
    return await knex('fact_to_pages')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

function toRow(
  record: Omit<FactToPageRecord, 'id'>
): Omit<FactToPageRow, 'id'> {
  return {
    block_number: record.blockNumber,
    fact_hash: record.stateTransitionHash.toString(),
    page_hash: record.pageHash.toString(),
    index: record.index,
  }
}

function toRecord(row: FactToPageRow): FactToPageRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    stateTransitionHash: Hash256(row.fact_hash),
    pageHash: Hash256(row.page_hash),
    index: row.index,
  }
}
