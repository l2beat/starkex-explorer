import { TradingMode } from '@explorer/shared'
import { LoggerOptions } from '@l2beat/backend-tools'
import { Knex } from 'knex'

import { StarkexConfig } from './starkex/StarkexConfig'

export interface Config<T extends TradingMode = TradingMode> {
  name: string
  logger: Pick<LoggerOptions, 'logLevel' | 'format'> & Partial<LoggerOptions>
  port: number
  databaseConnection: string | Knex.StaticConnectionConfig
  enableSync: boolean
  enablePreprocessing: boolean
  freshStart: boolean
  forceHttps: boolean
  basicAuth?: string
  starkex: StarkexConfig<T>
}
