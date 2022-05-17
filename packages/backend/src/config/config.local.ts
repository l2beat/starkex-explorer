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
    databaseConnection: getEnv('LOCAL_DB_URL'),
    enableSync: true,
    jsonRpcUrl: getEnv('LOCAL_JSON_RPC_URL'),
    core: {
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      maxBlockNumber: getEnv.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    freshStart: getEnv.boolean('FRESH_START', false),
  }
}
