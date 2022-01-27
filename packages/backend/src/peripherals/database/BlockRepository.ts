import { Knex } from 'knex'
import { BlockRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

/** block of the first verifier deploy */
const EARLIEST_BLOCK: BlockRecord = {
  number: 11813207,
  hash: '0xe191f743db9d988ff2dbeda3ec800954445f61cf8e79cc458ba831965e628e8d',
}

export interface BlockRecord {
  number: number
  hash: string
}

export class BlockRepository implements Repository<BlockRecord> {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async add(records: BlockRecord[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'add', rows: 0 })
      return
    }

    const rows: BlockRow[] = records
    await this.knex('blocks').insert(rows)

    this.logger.debug({ method: 'add', rows: rows.length })
  }

  async getAll(): Promise<BlockRecord[]> {
    const rows = await this.knex('blocks').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows
  }

  async deleteAll() {
    await this.knex('blocks').delete()
    this.logger.debug({ method: 'deleteAll' })
  }

  async deleteAllAfter(blockNumber: number) {
    const rowsCount = await this.knex('blocks')
      .where('number', '>', blockNumber)
      .delete()

    this.logger.debug({ method: 'deleteAllAfter', rows: rowsCount })
  }

  async getLast(): Promise<BlockRecord> {
    let row = await this.knex('blocks').orderBy('number', 'desc').first()

    row ||= EARLIEST_BLOCK

    this.logger.debug({
      method: 'getLast',
      number: row.number,
      hash: row.hash,
    })

    return row
  }

  async getFirst(): Promise<BlockRecord> {
    let row = await this.knex('blocks').orderBy('number', 'asc').first()

    row ||= EARLIEST_BLOCK

    this.logger.debug({
      method: 'getFirst',
      number: row.number,
      hash: row.hash,
    })

    return row
  }

  async getByNumber(number: number): Promise<BlockRecord | undefined> {
    const row = await this.knex('blocks').where('number', number).first()

    this.logger.debug({
      method: 'getByNumber',
      number,
      hash: row?.hash || null,
    })

    return row
  }

  async getByHash(hash: string): Promise<BlockRecord | undefined> {
    const row = await this.knex('blocks').where('hash', hash).first()

    this.logger.debug({
      method: 'getByHash',
      hash,
      number: row?.number || null,
    })

    return row
  }
}
