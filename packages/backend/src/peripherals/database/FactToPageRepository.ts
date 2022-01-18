import { Knex } from 'knex'
import { AssetBalanceJson, FactToPageRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface FactToPageRecord {
  id?: number
  blockNumber: number
  factHash: string
  pageHash: string
}

export class FactToPageRepository implements Repository<FactToPageRecord> {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async add(records: FactToPageRecord[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'addOrUpdate', rows: 0 })
      return
    }

    const rows: FactToPageRow[] = records.map(toRow)
    await this.knex('fact_to_pages').insert(rows)

    this.logger.debug({ method: 'addOrUpdate', rows: rows.length })
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
}

function toRow(record: FactToPageRecord): FactToPageRow {
  return {
    id: record.id,
    block_number: record.blockNumber,
    fact_hash: record.factHash,
    page_hash: record.pageHash,
  }
}

function toRecord(row: FactToPageRow): FactToPageRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    factHash: row.fact_hash,
    pageHash: row.page_hash,
  }
}
