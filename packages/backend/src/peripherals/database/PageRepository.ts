import { Knex } from 'knex'
import { PageRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface PageRecord {
  id?: number
  blockNumber: number
  pageHash: string
  page: string
}

export class PageRepository implements Repository<PageRecord> {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async add(records: PageRecord[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'addOrUpdate', rows: 0 })
      return
    }

    const rows: PageRow[] = records.map(toRow)
    await this.knex('pages').insert(rows)

    this.logger.debug({ method: 'addOrUpdate', rows: rows.length })
  }

  async getAll() {
    const rows = await this.knex('pages').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async deleteAll() {
    await this.knex('pages').delete()
    this.logger.debug({ method: 'deleteAll' })
  }
}

function toRow(record: PageRecord): PageRow {
  return {
    id: record.id,
    block_number: record.blockNumber,
    page_hash: record.pageHash,
    page: record.page,
  }
}

function toRecord(row: PageRow): PageRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    pageHash: row.page_hash,
    page: row.page,
  }
}
