import { Knex } from 'knex'
import { StateTransitionFactRow } from 'knex/types/tables'

import { Hash256 } from '../../model'
import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface StateTransitionFactRecord {
  id?: number
  blockNumber: number
  hash: Hash256
}

export class StateTransitionFactRepository
  implements Repository<StateTransitionFactRecord>
{
  constructor(private readonly knex: Knex, private readonly logger: Logger) {
    this.logger = this.logger.for(this)
  }

  async add(records: StateTransitionFactRecord[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'add', rows: 0 })
      return
    }

    const rows: StateTransitionFactRow[] = records.map(toRow)

    await this.knex('state_transition_facts').insert(rows)

    this.logger.debug({ method: 'add', rows: rows.length })
  }

  async getAll() {
    const rows = await this.knex('state_transition_facts')
      .select('*')
      .orderBy('block_number')
    this.logger.debug({ method: 'getAll', rows: rows.length })

    return rows.map(toRecord)
  }

  async deleteAll() {
    await this.knex('state_transition_facts').delete()
    this.logger.debug({ method: 'deleteAll' })
  }

  async deleteAllAfter(blockNumber: number) {
    const rowsCount = await this.knex('state_transition_facts')
      .where('block_number', '>', blockNumber)
      .delete()
    this.logger.debug({ method: 'deleteAllAfter', rows: rowsCount })
  }
}

function toRow(record: StateTransitionFactRecord): StateTransitionFactRow {
  return {
    id: record.id,
    block_number: record.blockNumber,
    hash: record.hash.toString(),
  }
}

function toRecord(row: StateTransitionFactRow): StateTransitionFactRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    hash: Hash256(row.hash),
  }
}
