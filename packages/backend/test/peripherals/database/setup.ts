import { randomUUID as uuid } from 'crypto'
import type { Knex } from 'knex'

import { getConfig } from '../../../src/config'
import { __SKIP_DB_TESTS__ } from '../../../src/config/config.testing'
import { DatabaseService } from '../../../src/peripherals/database/DatabaseService'

export function setupDatabaseTestSuite() {
  const config = getConfig('test')
  const searchPath = ['public']
  const knex = DatabaseService.createKnexInstance(config.databaseUrl, {
    searchPath,
  })
  const skip = config.databaseUrl === __SKIP_DB_TESTS__

  before(async function () {
    if (skip) {
      this.skip()
    } else {
      try {
        // For describe("one", () => describe("two") => {}) test suite we set up
        // 'test_one_two' schema before running tests.
        const titlePath = this.test?.parent?.titlePath()?.join('_')
        const schemaName = snakeCase(`test_${titlePath || uuid()}`)
        searchPath[0] = schemaName

        // We drop before instead of after tests, so we can inspect the
        // contents of database when tests fail.
        await knex.schema.dropSchemaIfExists(schemaName, true)
        await knex.schema.createSchema(schemaName)
        console.log('    > Creating test schema', schemaName)

        await knex.migrate.latest({ schemaName })
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

function snakeCase(str: string) {
  return str
    .replace(/[^\w\s]/g, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\s/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
}
