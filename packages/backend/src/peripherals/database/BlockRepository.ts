import { Knex } from 'knex'
import { BlockRow } from 'knex/types/tables'

import { Hash256 } from '../../model'
import { Logger } from '../../tools/Logger'
import { Repository } from './types'

/**
 * block of the first verifier deploy
 * @internal exported for tests
 */
export const EARLIEST_BLOCK: Readonly<BlockRecord> = {
  number: 11813207,
  hash: Hash256(
    '0xe191f743db9d988ff2dbeda3ec800954445f61cf8e79cc458ba831965e628e8d'
  ),
}

export interface BlockRecord {
  number: number
  hash: Hash256
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

    const rows: BlockRow[] = records.map(toRow)
    await this.knex('blocks').insert(rows)

    this.logger.debug({ method: 'add', rows: rows.length })
  }

  async getAll(): Promise<BlockRecord[]> {
    const rows = await this.knex('blocks').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async getAllInRange(from: number, to: number): Promise<BlockRecord[]> {
    const rows = await this.knex('blocks')
      .select('*')
      .where('number', '>=', from)
      .andWhere('number', '<=', to)
      .orderBy('number')
    this.logger.debug({ method: 'getAllUntil', rows: rows.length })
    return rows.map(toRecord)
  }

  async getLast(): Promise<BlockRecord> {
    const row = await this.knex('blocks').orderBy('number', 'desc').first()

    let record = row && toRecord(row)

    record ||= EARLIEST_BLOCK

    this.logger.debug({
      method: 'getLast',
      number: record.number,
      hash: record.hash.toString(),
    })

    return record
  }

  getFirst(): BlockRecord {
    return EARLIEST_BLOCK
  }

  async getByNumber(number: number): Promise<BlockRecord | undefined> {
    const row = await this.knex('blocks').where('number', number).first()

    this.logger.debug({
      method: 'getByNumber',
      number,
      hash: row?.hash || null,
    })

    return row && toRecord(row)
  }

  async getByHash(hash: Hash256): Promise<BlockRecord | undefined> {
    const row = await this.knex('blocks').where('hash', hash.toString()).first()

    this.logger.debug({
      method: 'getByHash',
      hash: hash.toString(),
      number: row?.number || null,
    })

    return row && toRecord(row)
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
}

function toRow(record: BlockRecord): BlockRow {
  return {
    hash: record.hash.toString(),
    number: record.number,
  }
}

function toRecord(row: BlockRow): BlockRecord {
  return {
    hash: Hash256(row.hash),
    number: row.number,
  }
}
