import { Knex } from 'knex'
import { VerifierRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface VerifierRecord {
  address: string
  blockNumber: number
}

export class VerifierRepository implements Repository<VerifierRecord> {
  constructor(private readonly knex: Knex, private readonly logger: Logger) {
    this.logger = this.logger.for(this)
  }

  async addOrUpdate(records: VerifierRecord[]) {
    const rows: VerifierRow[] = records.map(toRow)
    const primaryKey: keyof VerifierRow = 'address'

    await this.knex('verifiers').insert(rows).onConflict([primaryKey]).merge()

    this.logger.debug({ method: 'add', rows: rows.length })
  }

  async getAll() {
    const rows = await this.knex('verifiers').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async deleteAll() {
    await this.knex('verifiers').delete()
    this.logger.debug({ method: 'deleteAll' })
  }
}

function toRow(record: VerifierRecord): VerifierRow {
  return {
    address: record.address,
    block_number: record.blockNumber,
  }
}

function toRecord(row: VerifierRow): VerifierRecord {
  return {
    address: row.address,
    blockNumber: row.block_number,
  }
}
