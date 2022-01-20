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
      connectionString: getEnv('DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
    },
    jsonRpcUrl: getEnv('JSON_RPC_URL'),
    core: {
      safeBlock: {
        refreshIntervalMs: 5 * 60 * 1000,
        blockOffset: 100,
      },
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
    },
    freshStart: getEnv.boolean('FRESH_START', false),
  }
}
