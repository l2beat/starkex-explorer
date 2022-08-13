import { VerifierEventRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface VerifierEventRecord {
  id: number
  name: 'ImplementationAdded' | 'Upgraded'
  implementation: string
  initializer?: string
  blockNumber: number
}

export class VerifierEventRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addMany(records: Omit<VerifierEventRecord, 'id'>[]) {
    const rows = records.map(toRow)
    const knex = await this.knex()
    const ids = await knex('verifier_events').insert(rows).returning('id')
    return ids.map((x) => x.id)
  }

  async getAll() {
    const knex = await this.knex()
    const rows = await knex('verifier_events').select('*')
    return rows.map(toRecord)
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('verifier_events').delete()
  }

  async deleteAfter(blockNumber: number) {
    const knex = await this.knex()
    return await knex('verifier_events')
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
