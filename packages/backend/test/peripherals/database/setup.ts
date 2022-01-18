import { randomUUID as uuid } from 'crypto'
import type { Knex } from 'knex'

import { getConfig } from '../../../src/config'
import { __SKIP_DB_TESTS__ } from '../../../src/config/config.testing'
import { DatabaseService } from '../../../src/peripherals/database/DatabaseService'

export function setupDatabaseTestSuite() {
  const config = getConfig('test')
  const skip = config.databaseUrl === __SKIP_DB_TESTS__
  let schemaName = ''
  let knex: Knex<any, unknown[]> = undefined as any;

  before(async function () {
    if (skip) {
      this.skip()
    } else {
      try {
        knex = DatabaseService.createKnexInstance(config.databaseUrl)

        // For describe("one", () => describe("two") => {}) test suite we set up
        // 'test_one_two' schema before running tests.

        const titlePath = this.test?.parent?.titlePath()
        schemaName = `test_${titlePath?.join('_') || uuid()}`

        log('Creating test schema', schemaName)

        // We drop before instead of after tests, so we can inspect the
        // contents of database when tests fail.
        await knex.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
        await knex.raw(`CREATE SCHEMA "${schemaName}"`)
        await knex.raw(`SET SCHEMA '${schemaName}'`)

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

function log(...args: unknown[]) {
  console.log('    >', ...args)
}

async function printTables(knex: Knex) {
  const tables = await knex.raw(
    'SELECT table_name, current_schema(), current_database() FROM information_schema.tables WHERE table_schema = current_schema()'
  )
  console.log('tables:', tables.rows)
}
