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
    enableSync: true,
    jsonRpcUrl: getEnv('JSON_RPC_URL'),
    core: {
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      maxBlockNumber: getEnv.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    freshStart: false,
  }
}
