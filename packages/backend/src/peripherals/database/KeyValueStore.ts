import { Knex } from 'knex'
import { KeyValueRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export interface KeyValueRecord {
  key: string
  value: string
}

export class KeyValueStore extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.findByKey = this.wrapFind(this.findByKey)
    this.addOrUpdate = this.wrapAdd(this.addOrUpdate)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteByKey = this.wrapDelete(this.deleteByKey)
  }

  async findByKey(key: string): Promise<string | undefined> {
    const row = await this.knex('key_values')
      .select('value')
      .where({ key })
      .first()
    return row?.value
  }

  async addOrUpdate(record: KeyValueRecord) {
    const primaryKey: keyof KeyValueRow = 'key'
    await this.knex('key_values')
      .insert(record)
      .onConflict([primaryKey])
      .merge()
    return record.key
  }

  async getAll(): Promise<KeyValueRecord[]> {
    return this.knex('key_values').select('*')
  }

  async deleteAll() {
    return this.knex('key_values').delete()
  }

  async deleteByKey(key: string) {
    return this.knex('key_values').where({ key }).delete()
  }
}
