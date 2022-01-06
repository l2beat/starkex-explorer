import { config as dotenv } from 'dotenv'

import { LogLevel } from '../tools/Logger'
import { Config } from './Config'

export function getTestConfig(): Config {
  dotenv()
  return {
    name: 'dYdXStateExplorer/Test',
    logger: {
      logLevel: LogLevel.NONE,
      format: 'json',
    },
    port: 1337,
  }
}
