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
      await knex.migrate.latest()
    }
  })

  after(async () => {
    await knex.destroy()
  })

  return { knex }
}
