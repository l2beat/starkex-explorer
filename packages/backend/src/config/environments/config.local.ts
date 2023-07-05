import { config as dotenv } from 'dotenv'

import { LogLevel } from '../../tools/Logger'
import { Config } from '../Config'
import { getEnv } from '../getEnv'
import { getStarkexConfig } from '../starkex'

export function getLocalConfig(): Config {
  dotenv()
  return {
    name: 'StarkexExplorer/Local',
    logger: {
      logLevel: getEnv.integer('LOG_LEVEL', LogLevel.INFO),
      format: 'pretty',
    },
    port: getEnv.integer('PORT', 3000),
    databaseConnection: getEnv('LOCAL_DB_URL'),
    enableSync: getEnv.boolean('ENABLE_SYNC', true),
    enablePreprocessing: getEnv.boolean('ENABLE_PREPROCESSING', true),
    freshStart: getEnv.boolean('FRESH_START', false),
    forceHttps: false,
    starkex: getStarkexConfig(getEnv('STARKEX_INSTANCE')),
  }
}
