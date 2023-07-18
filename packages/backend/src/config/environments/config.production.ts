import { Env } from '@l2beat/backend-tools'
import { LogLevel } from '../../tools/Logger'
import { Config } from '../Config'
import { getStarkexConfig } from '../starkex'

export function getProductionConfig(env: Env): Config {
  return {
    name: 'StarkexExplorer/Production',
    logger: {
      logLevel: LogLevel.INFO,
      format: 'json',
    },
    port: env.integer('PORT'),
    databaseConnection: {
      connectionString: env.string('DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
    },
    enableSync: true,
    enablePreprocessing: env.boolean('ENABLE_PREPROCESSING', true),
    freshStart: false,
    forceHttps: true,
    starkex: getStarkexConfig(env),
  }
}
