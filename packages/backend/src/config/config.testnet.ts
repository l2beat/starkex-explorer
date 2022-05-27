import { EthereumAddress } from '@explorer/types'
import { config as dotenv } from 'dotenv'

import { LogLevel } from '../tools/Logger'
import { Config } from './Config'
import { getEnv } from './getEnv'

export function getTestnetConfig(): Config {
  dotenv()
  return {
    name: 'dYdXStateExplorer/Testnet',
    logger: {
      logLevel: getEnv.integer('LOG_LEVEL', LogLevel.INFO),
      format: 'pretty',
    },
    port: getEnv.integer('PORT', 3000),
    databaseConnection: getEnv('LOCAL_DB_URL'),
    enableSync: true,
    jsonRpcUrl: 'http://127.0.0.1:8545',
    core: {
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 0,
      maxBlockNumber: getEnv.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    contracts: {
      perpetual: EthereumAddress('0x27fac828D6E6862901ea8471fF22552D84e155D0'),
      registry: EthereumAddress('0xE068d37a67cAb19e0A6DFE88e720f076cfA7140E'),
      proxy: EthereumAddress.ZERO,
      verifiers: [
        EthereumAddress('0x6ebcf3c79b5bC9195F26dE459f57B6d2f0f27861'),
      ],
    },
    freshStart: true,
  }
}
