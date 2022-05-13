import { Knex } from 'knex'
import { VerifierEventRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export interface VerifierEventRecord {
  id: number
  name: 'ImplementationAdded' | 'Upgraded'
  implementation: string
  initializer?: string
  blockNumber: number
}

export class VerifierEventRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
  }

  async addMany(records: Omit<VerifierEventRecord, 'id'>[]) {
    const rows = records.map(toRow)
    return this.knex('verifier_events').insert(rows).returning('id')
  }

  async getAll() {
    const rows = await this.knex('verifier_events').select('*')
    return rows.map(toRecord)
  }

  async deleteAll() {
    return this.knex('verifier_events').delete()
  }

  async deleteAfter(blockNumber: number) {
    return await this.knex('verifier_events')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

function toRow(
  record: Omit<VerifierEventRecord, 'id'>
): Omit<VerifierEventRow, 'id'> {
  if (record.name === 'ImplementationAdded' && !record.initializer) {
    throw new Error("'initializer' is required on ImplementationAdded event")
  }
  return {
    name: record.name,
    block_number: record.blockNumber,
    implementation: record.implementation,
    initializer: record.initializer,
  }
}

function toRecord(row: VerifierEventRow): VerifierEventRecord {
  if (row.name === 'ImplementationAdded' && !row.initializer) {
    throw new Error("'initializer' is required on ImplementationAdded event")
  }
  const record: VerifierEventRecord = {
    id: row.id,
    name: row.name,
    implementation: row.implementation,
    blockNumber: row.block_number,
  }
  if (row.initializer) {
    record.initializer = row.initializer
  }
  return record
}
