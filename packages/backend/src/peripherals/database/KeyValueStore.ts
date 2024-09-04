import { stringAsBoolean, stringAsInt } from '@explorer/shared'
import { Logger } from '@l2beat/backend-tools'
import { Knex } from 'knex'
import { KeyValueRow } from 'knex/types/tables'
import { z } from 'zod'

import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export type KeyValueRecord = z.infer<typeof KeyValueRecord>
export const KeyValueRecord = z.union([
  z.object({ key: z.literal('softwareMigrationNumber'), value: stringAsInt() }),
  z.object({ key: z.literal('lastBlockNumberSynced'), value: stringAsInt() }),
  z.object({ key: z.literal('lastSyncedThirdPartyId'), value: stringAsInt() }),
  z.object({
    key: z.literal('freezeStatus'),
    value: z.union([
      z.literal('not-frozen'),
      z.literal('freezable'),
      z.literal('frozen'),
    ]),
  }),
  z.object({
    key: z.literal('userStatisticsPreprocessorCaughtUp'),
    value: stringAsBoolean(),
  }),
])

type ValueForKey<K extends KeyValueRecord['key']> = Extract<
  KeyValueRecord,
  { key?: K }
>['value']

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

  async findByKeyWithDefault<K extends KeyValueRecord['key']>(
    key: K,
    defaultValue: ValueForKey<K>,
    trx?: Knex.Transaction
  ): Promise<ValueForKey<K>> {
    const value = await this.findByKey(key, trx)
    return value === undefined ? defaultValue : value
  }

  async findByKey<K extends KeyValueRecord['key']>(
    key: K,
    trx?: Knex.Transaction
  ): Promise<ValueForKey<K> | undefined> {
    const knex = await this.knex(trx)
    const row = await knex('key_values').where({ key }).first()
    return row ? (toRecord(row).value as ValueForKey<K>) : undefined
  }

  async addOrUpdate<K extends KeyValueRecord>(
    record: K,
    trx?: Knex.Transaction
  ): Promise<K['key']> {
    const primaryKey: keyof KeyValueRow = 'key'
    const knex = await this.knex(trx)
    await knex('key_values')
      .insert(toRow(record))
      .onConflict([primaryKey])
      .merge()
    return record.key
  }

  async getAll(): Promise<KeyValueRecord[]> {
    const knex = await this.knex()
    const rows = await knex('key_values').select('*')
    return rows.map(toRecord)
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('key_values').delete()
  }

  async deleteByKey(key: KeyValueRecord['key']) {
    const knex = await this.knex()
    return knex('key_values').where({ key }).delete()
  }
}

function toRecord(row: KeyValueRow): KeyValueRecord {
  return KeyValueRecord.parse(row)
}

function toRow(record: KeyValueRecord): KeyValueRow {
  return {
    key: record.key,
    value: record.value.toString(),
  }
}
