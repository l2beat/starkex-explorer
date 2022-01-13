import { config as dotenv } from 'dotenv'

import { LogLevel } from '../tools/Logger'
import { Config } from './Config'
import { getEnv } from './getEnv'

export function getLocalConfig(): Config {
  dotenv()
  return {
    name: 'dYdXStateExplorer/Local',
    logger: {
      logLevel: getEnv.integer('LOG_LEVEL', LogLevel.INFO),
      format: 'pretty',
    },
    port: getEnv.integer('PORT', 3000),
    databaseUrl: getEnv('LOCAL_DB_URL'),
    jsonRpcUrl: getEnv('LOCAL_JSON_RPC_URL'),
    core: {
      safeBlock: {
        refreshIntervalMs: 1 * 60 * 1000,
        blockOffset: 100,
      },
      sync: {
        batchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      },
    },
  }
}
