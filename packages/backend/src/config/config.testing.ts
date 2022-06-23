import { EthereumAddress } from '@explorer/types'
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
    enableSync: true,
    jsonRpcUrl: getEnv('TEST_JSON_RPC_URL', 'http://localhost:8545'),
    core: {
      safeBlockDistance: 5,
      syncBatchSize: 6_000,
      minBlockNumber: 11813207,
    },
    contracts: {
      perpetual: EthereumAddress.ZERO,
      registry: EthereumAddress.ZERO,
      proxy: EthereumAddress.ZERO,
      verifiers: [],
    },
    freshStart: true, // not relevant for tests
    forceHttps: false, // not relevant for tests
  }
}
