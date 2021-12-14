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
  }
}
