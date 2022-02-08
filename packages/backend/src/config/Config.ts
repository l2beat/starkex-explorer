import { Knex } from 'knex'

import { LogLevel } from '../tools/Logger'

export interface Config {
  name: string
  logger: {
    logLevel: LogLevel
    format: 'pretty' | 'json'
  }
  port: number
  databaseConnection: string | Knex.StaticConnectionConfig
  jsonRpcUrl: string
  core: {
    syncBatchSize: number
  }
  freshStart: boolean
}
