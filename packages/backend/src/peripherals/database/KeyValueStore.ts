import { KeyValueRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface KeyValueRecord {
  key: string
  value: string
}

export class KeyValueStore extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.findByKey = this.wrapFind(this.findByKey)
    this.addOrUpdate = this.wrapAdd(this.addOrUpdate)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteByKey = this.wrapDelete(this.deleteByKey)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async findByKey(key: string): Promise<string | undefined> {
    const knex = await this.knex()
    const row = await knex('key_values').select('value').where({ key }).first()
    return row?.value
  }

  async addOrUpdate(record: KeyValueRecord) {
    const primaryKey: keyof KeyValueRow = 'key'
    const knex = await this.knex()
    await knex('key_values').insert(record).onConflict([primaryKey]).merge()
    return record.key
  }

  async getAll(): Promise<KeyValueRecord[]> {
    const knex = await this.knex()
    return knex('key_values').select('*')
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('key_values').delete()
  }

  async deleteByKey(key: string) {
    const knex = await this.knex()
    return knex('key_values').where({ key }).delete()
  }
}
