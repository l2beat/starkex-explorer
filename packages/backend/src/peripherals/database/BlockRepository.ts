import { Hash256 } from '@explorer/types'
import { Knex } from 'knex'
import { BlockRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export interface BlockRecord {
  number: number
  hash: Hash256
}

export class BlockRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)

    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.getAllInRange = this.wrapGet(this.getAllInRange)
    this.findLast = this.wrapFind(this.findLast)
    this.findByNumber = this.wrapFind(this.findByNumber)
    this.findByHash = this.wrapFind(this.findByHash)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAllAfter = this.wrapDelete(this.deleteAllAfter)
  }

  async addMany(records: BlockRecord[]) {
    const rows: BlockRow[] = records.map(toRow)
    const numbers = await this.knex('blocks').insert(rows).returning('number')
    return numbers
  }

  async getAll(): Promise<BlockRecord[]> {
    const rows = await this.knex('blocks').select('*')
    return rows.map(toRecord)
  }

  async getAllInRange(from: number, to: number): Promise<BlockRecord[]> {
    const rows = await this.knex('blocks')
      .select('*')
      .where('number', '>=', from)
      .andWhere('number', '<=', to)
      .orderBy('number')
    return rows.map(toRecord)
  }

  async findLast(): Promise<BlockRecord | undefined> {
    const row = await this.knex('blocks').orderBy('number', 'desc').first()
    return row && toRecord(row)
  }

  async findByNumber(number: number): Promise<BlockRecord | undefined> {
    const row = await this.knex('blocks').where('number', number).first()
    return row && toRecord(row)
  }

  async findByHash(hash: Hash256): Promise<BlockRecord | undefined> {
    const row = await this.knex('blocks').where('hash', hash.toString()).first()
    return row && toRecord(row)
  }

  async deleteAll() {
    return await this.knex('blocks').delete()
  }

  async deleteAllAfter(blockNumber: number) {
    return await this.knex('blocks').where('number', '>', blockNumber).delete()
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
