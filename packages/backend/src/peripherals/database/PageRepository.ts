import { Hash256 } from '@explorer/types'
import { Knex } from 'knex'
import { PageRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export interface PageRecord {
  id: number
  blockNumber: number
  pageHash: Hash256
  data: string
}

export class PageRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.getByFactHashes = this.wrapGet(this.getByFactHashes)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
  }

  async addMany(records: Omit<PageRecord, 'id'>[]) {
    const rows = records.map(toRow)
    return this.knex('pages').insert(rows).returning('id')
  }

  async getAll() {
    const rows = await this.knex('pages').select('*')
    return rows.map(toRecord)
  }

  async getByFactHashes(factHashes: Hash256[]) {
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
    return this.knex('pages').delete()
  }

  async deleteAfter(blockNumber: number) {
    return this.knex('pages').where('block_number', '>', blockNumber).delete()
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
