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

    this.logger.debug({ method: 'add', rows: rows.length })
  }

  async getAll() {
    const rows = await this.knex('pages').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async getAllForFacts(factHashes: string[]) {
    const rows = await this.knex('fact_to_pages')
      .join('pages', 'fact_to_pages.page_hash', 'pages.page_hash')
      .select('fact_hash', 'pages.page_hash', 'page')
      .whereIn('fact_hash', factHashes)

    this.logger.debug({ method: 'getAllPagesForFacts', rows: rows.length })

    return rows.map((row) => ({
      factHash: row.fact_hash,
      pageHash: row.page_hash,
      page: row.page,
    }))
  }

  async deleteAll() {
    await this.knex('pages').delete()
    this.logger.debug({ method: 'deleteAll' })
  }

  async deleteAllAfter(blockNumber: number) {
    const rowsCount = await this.knex('pages')
      .where('block_number', '>', blockNumber)
      .delete()

    this.logger.debug({ method: 'deleteAllAfter', rows: rowsCount })
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
