import { Hash256 } from '@explorer/types'
import { Knex } from 'knex'
import { FactToPageRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface FactToPageRecord {
  id?: number
  blockNumber: number
  factHash: Hash256
  pageHash: Hash256
  index: number
}

export class FactToPageRepository implements Repository<FactToPageRecord> {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async add(records: FactToPageRecord[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'add', rows: 0 })
      return
    }

    const rows: FactToPageRow[] = records.map(toRow)
    await this.knex('fact_to_pages').insert(rows)

    this.logger.debug({ method: 'add', rows: rows.length })
  }

  async getAll() {
    const rows = await this.knex('fact_to_pages').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async deleteAll() {
    await this.knex('fact_to_pages').delete()
    this.logger.debug({ method: 'deleteAll' })
  }

  async deleteAllAfter(blockNumber: number) {
    const rowsCount = await this.knex('fact_to_pages')
      .where('block_number', '>', blockNumber)
      .delete()

    this.logger.debug({ method: 'deleteAllAfter', rows: rowsCount })
  }
}

function toRow(record: FactToPageRecord): FactToPageRow {
  return {
    id: record.id,
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
