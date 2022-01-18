import { Knex } from 'knex'
import { KeyValueRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

type KeyValueRecord = KeyValueRow

export class KeyValueStore<K extends string>
  implements Omit<Repository<KeyValueRecord>, 'addOrUpdate'>
{
  constructor(private readonly knex: Knex, private readonly logger: Logger) {
    this.logger = logger.for(this)
  }

  async get(key: K): Promise<string | undefined> {
    const row = await this.knex('key_values')
      .select('value')
      .where({ key })
      .first()
    const value = row?.value
    this.logger.debug({ method: 'get', key, value: value || null })
    return value
  }

  async set(key: K, value: string): Promise<void> {
    const primaryKey: keyof KeyValueRow = 'key'
    const res: unknown = await this.knex('key_values')
      .insert({ key, value })
      .onConflict([primaryKey])
      .merge()

    this.logger.debug({
      method: 'set',
      key,
      value,
      rowCount: (res as { rowCount: number }).rowCount,
    })
  }

  async getAll(): Promise<KeyValueRow[]> {
    const rows = await this.knex('key_values').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows
  }

  async deleteAll(): Promise<void> {
    await this.knex('key_values').delete()
    this.logger.debug({ method: 'deleteAll' })
  }

  async delete(key: string): Promise<void> {
    await this.knex('key_values').where({ key }).delete()
  }
}
