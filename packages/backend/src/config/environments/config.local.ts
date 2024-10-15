import { Env, LoggerOptions } from '@l2beat/backend-tools'

import { Config } from '../Config'
import { getStarkexConfig } from '../starkex'

export function getLocalConfig(env: Env): Config {
  const starkexConfig = getStarkexConfig(env)
  const isHardhatFork = env.optionalBoolean('HARDHAT_FORK')

  return {
    name: 'StarkexExplorer/Local',
    logger: {
      logLevel: env.string('LOG_LEVEL', 'INFO') as LoggerOptions['logLevel'],
      format: env.string('LOG_FORMAT', 'pretty') as LoggerOptions['format'],
      colors: true,
    },
    port: env.integer('PORT', 3000),
    databaseConnection: env.string('LOCAL_DB_URL'),
    basicAuth: env.optionalString('BASIC_AUTH'),
    enableSync: true,
    enablePreprocessing: env.boolean('ENABLE_PREPROCESSING', true),
    freshStart: env.boolean('FRESH_START', false),
    forceHttps: false,
    starkex: {
      ...starkexConfig,
      blockchain: {
        ...starkexConfig.blockchain,
        chainId: starkexConfig.blockchain.chainId,
        jsonRpcUrl: isHardhatFork
          ? 'http://localhost:8545'
          : starkexConfig.blockchain.jsonRpcUrl,
      },
    },
  }
}
