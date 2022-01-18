import type { Knex } from 'knex'

import { getConfig } from '../../../src/config'
import { __SKIP_DB_TESTS__ } from '../../../src/config/config.testing'
import { DatabaseService } from '../../../src/peripherals/database/DatabaseService'

export function setupDatabaseTestSuite() {
  const config = getConfig('test')
  const knex = DatabaseService.createKnexInstance(config.databaseUrl)
  const skip = config.databaseUrl === __SKIP_DB_TESTS__

  before(async function () {
    if (skip) {
      this.skip()
    } else {
      try {
        await knex.migrate.latest()
      } catch (err) {
        console.error('database test suite setup failed')
        await printTables(knex)
        throw err
      }
    }
  })

  after(async () => {
    await knex.destroy()
  })

  return { knex }
}

async function printTables(knex: Knex) {
  const tables = await knex.raw(
    'SELECT table_name, current_schema(), current_database() FROM information_schema.tables WHERE table_schema = current_schema()'
  )
  console.log('tables:', tables.rows)
}
