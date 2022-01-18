import { expect } from 'earljs'
import { Knex } from 'knex'

import { getConfig } from '../../../src/config'
import { __SKIP_DB_TESTS__ } from '../../../src/config/config.testing'
import { DatabaseService } from '../../../src/peripherals/database/DatabaseService'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe('DatabaseService', () => {
  const { knex } = setupDatabaseTestSuite()

  it('can run and rollback all migrations', async () => {
    const databaseService = new DatabaseService(knex, Logger.SILENT)

    await databaseService.migrateToLatest()
    await databaseService.rollbackAll()
    const result = await knex.raw(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()'
    )
    const tables = result.rows.map((x: { table_name: string }) => x.table_name)

    expect(tables).toEqual(
      expect.arrayWith('knex_migrations', 'knex_migrations_lock')
    )
  })
})
