import { TradingMode } from '@explorer/shared'
import { Knex } from 'knex'

import { LogLevel } from '../tools/Logger'
import { StarkexConfig } from './starkex/StarkexConfig'

export interface Config<T extends TradingMode = TradingMode> {
  name: string
  logger: {
    logLevel: LogLevel
    format: 'pretty' | 'json'
  }
  port: number
  databaseConnection: string | Knex.StaticConnectionConfig
  enableSync: boolean
  enablePreprocessing: boolean
  freshStart: boolean
  forceHttps: boolean
  starkex: StarkexConfig<T>
}
