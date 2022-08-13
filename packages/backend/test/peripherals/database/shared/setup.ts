import { getConfig } from '../../../../src/config'
import { Database } from '../../../../src/peripherals/database/shared/Database'
import { Logger } from '../../../../src/tools/Logger'

export function setupDatabaseTestSuite() {
  const config = getConfig('test')
  const database = new Database(config.databaseConnection, Logger.SILENT)
  const skip = config.databaseConnection === 'xXTestDatabaseUrlXx'

  before(async function () {
    if (skip) {
      this.skip()
    } else {
      await database.migrateToLatest()
    }
  })

  after(async () => {
    await database.closeConnection()
  })

  return { database }
}
