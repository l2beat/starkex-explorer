import { Env } from '@l2beat/backend-tools'
import { LogLevel } from '../../tools/Logger'
import { Config } from '../Config'
import { getStarkexConfig } from '../starkex'

export function getLocalConfig(env: Env): Config {
  return {
    name: 'StarkexExplorer/Local',
    logger: {
      logLevel: env.integer('LOG_LEVEL', LogLevel.INFO),
      format: 'pretty',
    },
    port: env.integer('PORT', 3000),
    databaseConnection: env.string('LOCAL_DB_URL'),
    enableSync: true,
    enablePreprocessing: env.boolean('ENABLE_PREPROCESSING', true),
    freshStart: env.boolean('FRESH_START', false),
    forceHttps: false,
    starkex: getStarkexConfig(env),
  }
}
