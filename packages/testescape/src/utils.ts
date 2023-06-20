import KnexConstructor, { Knex } from 'knex'
import { getEnv } from './getEnv'

export function getKnex(): Knex {
  const databaseConnection = getEnv('LOCAL_DB_URL')
  const knex = KnexConstructor({
    client: 'pg',
    connection: databaseConnection
  })
  return knex
}

export async function getLastSyncedBlock(knex: Knex): Promise<number> {
  const lastSyncedBlock = await knex('key_values')
    .select('value')
    .where('key', 'lastBlockNumberSynced')
    .first()
  if (!lastSyncedBlock) {
    throw new Error('lastBlockNumberSynced not found key_values table')
  }
  return parseInt(lastSyncedBlock?.value)
}
