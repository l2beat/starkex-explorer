import { EthereumAddress } from '@explorer/types'
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
  enableSync: boolean
  jsonRpcUrl: string
  core: {
    syncBatchSize: number
    maxBlockNumber?: number
  }
  contracts: {
    perpetual: EthereumAddress
    registry: EthereumAddress
    proxy: EthereumAddress
    verifiers: EthereumAddress[]
  }
  freshStart: boolean
}
