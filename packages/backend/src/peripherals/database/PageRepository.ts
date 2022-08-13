import { Hash256 } from '@explorer/types'
import { PageRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PageRecord {
  id: number
  blockNumber: number
  pageHash: Hash256
  data: string
}

export class PageRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.getByFactHashes = this.wrapGet(this.getByFactHashes)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addMany(records: Omit<PageRecord, 'id'>[]) {
    const rows = records.map(toRow)
    const knex = await this.knex()
    const ids = await knex('pages').insert(rows).returning('id')
    return ids.map((x) => x.id)
  }

  async getAll() {
    const knex = await this.knex()
    const rows = await knex('pages').select('*')
    return rows.map(toRecord)
  }

  async getByFactHashes(factHashes: Hash256[]) {
    interface Row {
      fact_hash: string
      page_block: number
      fact_block: number
      data: string
      index: number
    }

    const knex = await this.knex()
    const rows = (await knex('fact_to_pages')
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
        throw new Error(`Missing pages for fact: ${factHash.toString()}`)
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
    const knex = await this.knex()
    return knex('pages').delete()
  }

  async deleteAfter(blockNumber: number) {
    const knex = await this.knex()
    return knex('pages').where('block_number', '>', blockNumber).delete()
  }
}

function toRow(record: Omit<PageRecord, 'id'>): Omit<PageRow, 'id'> {
  return {
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
