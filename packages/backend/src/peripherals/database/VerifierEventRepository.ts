import { Knex } from 'knex'
import { VerifierEventRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export type VerifierEventRecord = (
  | ImplementationAddedEventRecord
  | UpgradedEventRecord
) & {
  id?: number
}

export interface ImplementationAddedEventRecord {
  implementation: string
  initializer: string
  blockNumber: number
  name: 'ImplementationAdded'
}

export interface UpgradedEventRecord {
  implementation: string
  blockNumber: number
  name: 'Upgraded'
}

export class VerifierEventRepository
  implements Repository<VerifierEventRecord>
{
  constructor(private readonly knex: Knex, private readonly logger: Logger) {
    this.logger = this.logger.for(this)
  }

  async add(records: VerifierEventRecord[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'add', rows: 0 })
      return
    }

    const rows: VerifierEventRow[] = records.map(toRow)

    await this.knex('verifier_events').insert(rows)

    this.logger.debug({ method: 'add', rows: rows.length })
  }

  async getAll() {
    const rows = await this.knex('verifier_events').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async deleteAll() {
    await this.knex('verifier_events').delete()
    this.logger.debug({ method: 'deleteAll' })
  }
}

function toRow(record: VerifierEventRecord): VerifierEventRow {
  switch (record.name) {
    case 'ImplementationAdded':
      return {
        id: record.id,
        block_number: record.blockNumber,
        implementation: record.implementation,
        initializer: record.initializer,
        name: 'ImplementationAdded',
      }
    case 'Upgraded':
      return {
        id: record.id,
        block_number: record.blockNumber,
        implementation: record.implementation,
        name: 'Upgraded',
      }
  }
}

function toRecord(row: VerifierEventRow): VerifierEventRecord {
  switch (row.name) {
    case 'ImplementationAdded':
      if (!row.initializer)
        throw new Error(
          "'initializer' is required on ImplmenedationAdded event"
        )

      return {
        id: row.id,
        implementation: row.implementation,
        initializer: row.initializer,
        blockNumber: row.block_number,
        name: 'ImplementationAdded',
      }
    case 'Upgraded':
      return {
        id: row.id,
        implementation: row.implementation,
        blockNumber: row.block_number,
        name: 'Upgraded',
      }
  }
}
