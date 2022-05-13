import { Hash256 } from '@explorer/types'
import { Knex } from 'knex'
import { FactToPageRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export interface FactToPageRecord {
  id: number
  blockNumber: number
  factHash: Hash256
  pageHash: Hash256
  index: number
}

export class FactToPageRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAllAfter = this.wrapDelete(this.deleteAllAfter)
  }

  async addMany(records: Omit<FactToPageRecord, 'id'>[]) {
    const rows = records.map(toRow)
    return await this.knex('fact_to_pages').insert(rows).returning('id')
  }

  async getAll() {
    const rows = await this.knex('fact_to_pages').select('*')
    return rows.map(toRecord)
  }

  async deleteAll() {
    return await this.knex('fact_to_pages').delete()
  }

  async deleteAllAfter(blockNumber: number) {
    return await this.knex('fact_to_pages')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

function toRow(
  record: Omit<FactToPageRecord, 'id'>
): Omit<FactToPageRow, 'id'> {
  return {
    block_number: record.blockNumber,
    fact_hash: record.factHash.toString(),
    page_hash: record.pageHash.toString(),
    index: record.index,
  }
}

function toRecord(row: FactToPageRow): FactToPageRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    factHash: Hash256(row.fact_hash),
    pageHash: Hash256(row.page_hash),
    index: row.index,
  }
}
