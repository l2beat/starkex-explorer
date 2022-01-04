import { config as dotenv } from 'dotenv'

import { LogLevel } from '../tools/Logger'
import { Config } from './Config'
import { getEnv } from './getEnv'

export function getTestConfig(): Config {
  dotenv()
  return {
    name: 'dYdXStateExplorer/Test',
    logger: {
      logLevel: LogLevel.NONE,
      format: 'json',
    },
    port: 1337,
    databaseUrl: getEnv('TEST_DB_URL', 'xXTestDatabaseUrlXx'),
  }
}
