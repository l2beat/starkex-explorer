import { Hash256 } from '@explorer/types'
import { BlockRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository, CheckConvention } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface BlockRecord {
  number: number
  hash: Hash256
}

export class BlockRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    this.autoWrap<CheckConvention<BlockRepository>>(this)
  }

  async addMany(records: BlockRecord[]) {
    const rows: BlockRow[] = records.map(toRow)
    const knex = await this.knex()
    const result = await knex('blocks').insert(rows).returning('number')
    return result.map((x) => x.number)
  }

  async getAll(): Promise<BlockRecord[]> {
    const knex = await this.knex()
    const rows = await knex('blocks').select('*')
    return rows.map(toRecord)
  }

  async getAllInRange(from: number, to: number): Promise<BlockRecord[]> {
    const knex = await this.knex()
    const rows = await knex('blocks')
      .select('*')
      .where('number', '>=', from)
      .andWhere('number', '<=', to)
      .orderBy('number')
    return rows.map(toRecord)
  }

  async findLast(): Promise<BlockRecord | undefined> {
    const knex = await this.knex()
    const row = await knex('blocks').orderBy('number', 'desc').first()
    return row && toRecord(row)
  }

  async findByNumber(number: number): Promise<BlockRecord | undefined> {
    const knex = await this.knex()
    const row = await knex('blocks').where('number', number).first()
    return row && toRecord(row)
  }

  async findByHash(hash: Hash256): Promise<BlockRecord | undefined> {
    const knex = await this.knex()
    const row = await knex('blocks').where('hash', hash.toString()).first()
    return row && toRecord(row)
  }

  async deleteAll() {
    const knex = await this.knex()
    return await knex('blocks').delete()
  }

  async deleteAfter(blockNumber: number) {
    const knex = await this.knex()
    return await knex('blocks').where('number', '>', blockNumber).delete()
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
