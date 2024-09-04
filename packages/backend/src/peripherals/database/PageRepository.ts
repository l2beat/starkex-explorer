import { Hash256 } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { PageRow } from 'knex/types/tables'

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
    this.getByStateTransitions = this.wrapGet(this.getByStateTransitions)
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

  async getByStateTransitions(stateTransitions: Hash256[]) {
    interface Row {
      state_transition_hash: string
      page_block: number
      page_mapping_block: number
      data: string
      page_index: number
    }

    const knex = await this.knex()
    const rows = (await knex('page_mappings')
      .select(
        'state_transition_hash',
        'page_mappings.block_number as page_mapping_block',
        'pages.block_number as page_block',
        'pages.data',
        'page_index'
      )
      .join('pages', 'page_mappings.page_hash', 'pages.page_hash')
      .whereIn(
        'state_transition_hash',
        stateTransitions.map((x) => x.toString())
      )) as Row[]

    const records = rows.map((row) => ({
      stateTransition: Hash256(row.state_transition_hash),
      pageMappingBlock: row.page_mapping_block,
      pageIndex: row.page_index,
      pageData: row.data,
      pageBlock: row.page_block,
    }))

    return stateTransitions.map((stateTransition) => {
      const relevant = records.filter(
        (x) => x.stateTransition === stateTransition
      )
      if (relevant.length === 0) {
        throw new Error(
          `Missing pages for state transition: ${stateTransition.toString()}`
        )
      }
      const lastMappingBlock = Math.max(
        ...relevant.map((x) => x.pageMappingBlock)
      )
      const allPages = relevant
        .filter((x) => x.pageMappingBlock === lastMappingBlock)
        .sort((a, b) => {
          const indexDiff = a.pageIndex - b.pageIndex
          if (indexDiff === 0) {
            return b.pageBlock - a.pageBlock
          }
          return indexDiff
        })
      const pages: string[] = []
      let lastIndex = -1
      for (const row of allPages) {
        if (row.pageIndex !== lastIndex) {
          lastIndex = row.pageIndex
          pages.push(row.pageData)
        }
      }
      return pages
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
