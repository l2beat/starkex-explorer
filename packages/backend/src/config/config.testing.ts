import { config as dotenv } from 'dotenv'

import { LogLevel } from '../tools/Logger'
import { Config } from './Config'
import { getEnv } from './getEnv'

export const __SKIP_DB_TESTS__ = '__SKIP_DB_TESTS__'

export function getTestConfig(): Config {
  dotenv()
  return {
    name: 'dYdXStateExplorer/Test',
    logger: {
      logLevel: LogLevel.NONE,
      format: 'json',
    },
    port: 1337,
    databaseConnection: getEnv('TEST_DB_URL', __SKIP_DB_TESTS__),
    jsonRpcUrl: getEnv('TEST_JSON_RPC_URL', 'http://localhost:8545'),
    core: {
      syncBatchSize: 6_000,
    },
    freshStart: true, // not relevant for tests
  }
}
