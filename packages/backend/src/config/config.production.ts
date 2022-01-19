import { LogLevel } from '../tools/Logger'
import { Config } from './Config'
import { getEnv } from './getEnv'

export function getProductionConfig(): Config {
  return {
    name: 'dYdXStateExplorer/Production',
    logger: {
      logLevel: LogLevel.INFO,
      format: 'json',
    },
    port: getEnv.integer('PORT'),
    databaseConnection: {
      connectString: getEnv('DATABASE_URL'),
      ssl: true,
    },
    jsonRpcUrl: getEnv('JSON_RPC_URL'),
    core: {
      safeBlock: {
        refreshIntervalMs: 5 * 60 * 1000,
        blockOffset: 100,
      },
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
    },
  }
}
