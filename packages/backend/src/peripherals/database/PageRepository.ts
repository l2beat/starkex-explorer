import { Hash256 } from '@explorer/types'
import { Knex } from 'knex'
import { PageRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface PageRecord {
  id?: number
  blockNumber: number
  pageHash: Hash256
  data: string
}

export class PageRepository implements Repository<PageRecord> {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async add(records: PageRecord[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'add', rows: 0 })
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

  async getAllForFacts(factHashes: Hash256[]) {
    type Row = {
      fact_hash: string
      page_block: number
      fact_block: number
      data: string
      index: number
    }

    const rows = (await this.knex('fact_to_pages')
      .select(
        'fact_hash',
        'fact_to_pages.block_number as fact_block',
        'pages.block_number as page_block',
        'pages.data',
        'index'
      )
      .join('pages', 'fact_to_pages.page_hash', 'pages.page_hash')
      .whereIn(
        'fact_hash',
        factHashes.map((x) => x.toString())
      )) as Row[]

    this.logger.debug({ method: 'getAllPagesForFacts', rows: rows.length })

    const records = rows.map((row) => ({
      factBlockNumber: row.fact_block,
      pageBlockNumber: row.page_block,
      factHash: Hash256(row.fact_hash),
      data: row.data,
      index: row.index,
    }))

    return factHashes.map((factHash) => {
      const relevant = records.filter((x) => x.factHash === factHash)
      if (relevant.length === 0) {
        throw new Error(`Missing pages for fact: ${factHash}`)
      }
      const maxFactBlockNumber = Math.max(
        ...relevant.map((x) => x.factBlockNumber)
      )
      const allPages = relevant
        .filter((x) => x.factBlockNumber === maxFactBlockNumber)
        .sort((a, b) => {
          const indexDiff = a.index - b.index
          if (indexDiff === 0) {
            return b.pageBlockNumber - a.pageBlockNumber
          }
          return indexDiff
        })
      const pages: string[] = []
      let lastIndex = -1
      for (const row of allPages) {
        if (row.index !== lastIndex) {
          lastIndex = row.index
          pages.push(row.data)
        }
      }
      return { factHash, pages }
    })
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
    page_hash: record.pageHash.toString(),
    data: record.data,
  }
}

function toRecord(row: PageRow): PageRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    pageHash: Hash256(row.page_hash),
    data: row.data,
  }
}
