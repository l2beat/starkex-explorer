import { Env } from '@l2beat/backend-tools'

import { Config } from '../Config'
import { getStarkexConfig } from '../starkex'

export function getProductionConfig(env: Env): Config {
  return {
    name: 'StarkexExplorer/Production',
    logger: {
      logLevel: 'INFO',
      format: 'json',
      utc: true,
    },
    port: env.integer('PORT'),
    databaseConnection: {
      connectionString: env.string('DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
    },
    basicAuth: env.optionalString('BASIC_AUTH'),
    enableSync: true,
    enablePreprocessing: env.boolean('ENABLE_PREPROCESSING', true),
    freshStart: false,
    forceHttps: true,
    starkex: getStarkexConfig(env),
  }
}
