import { Knex } from 'knex'
import { StateUpdateRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface StateUpdateRecord {
  id: number
  factHash: string
  rootHash: string
  factTimestamp: number
  dataTimestamp: number
}

export class StateUpdateRepository implements Repository<StateUpdateRecord> {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async add(records: StateUpdateRecord[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'add', rows: 0 })
      return
    }

    const rows: StateUpdateRow[] = records.map(toRow)
    await this.knex('state_updates').insert(rows)

    this.logger.debug({ method: 'add', rows: rows.length })
  }

  async delete(id: number) {
    await this.knex('state_updates').where('id', id).first().delete()
    this.logger.debug({ method: 'delete', id })
  }

  async getAll() {
    const rows = await this.knex('state_updates').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async deleteAll() {
    await this.knex('state_updates').delete()
    this.logger.debug({ method: 'deleteAll' })
  }
}

function toRecord(row: StateUpdateRow): StateUpdateRecord {
  return {
    id: row.id,
    factHash: row.fact_hash,
    rootHash: row.root_hash,
    factTimestamp: row.fact_timestamp,
    dataTimestamp: row.data_timestamp,
  }
}

function toRow(record: StateUpdateRecord): StateUpdateRow {
  return {
    id: record.id,
    fact_hash: record.factHash,
    root_hash: record.rootHash,
    fact_timestamp: record.factTimestamp,
    data_timestamp: record.dataTimestamp,
  }
}
