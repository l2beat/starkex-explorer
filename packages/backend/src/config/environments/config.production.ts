import { LogLevel } from '../../tools/Logger'
import { Config } from '../Config'
import { getEnv } from '../getEnv'
import { getStarkexConfig } from '../starkex'

export function getProductionConfig(): Config {
  return {
    name: 'StarkexExplorer/Production',
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
    enablePreprocessing: false,
    freshStart: false,
    forceHttps: true,
    starkex: getStarkexConfig(getEnv('STARKEX_INSTANCE')),
    useOldFrontend: true,
  }
}
