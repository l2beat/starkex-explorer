import { config as dotenv } from 'dotenv'

import { LogLevel } from '../tools/Logger'
import { Config } from './Config'
import { getEnv } from './getEnv'

export const __SKIP_DB_TESTS__ = '__SKIP_DB_TESTS__'

export function getTestConfig(): Config {
  dotenv()
  return {
    name: 'dYdXStateExplorer/Test',
    logger: {
      logLevel: LogLevel.NONE,
      format: 'json',
    },
    port: 1337,
    databaseUrl: getEnv('TEST_DB_URL', __SKIP_DB_TESTS__),
    jsonRpcUrl: getEnv('TEST_JSON_RPC_URL', 'http://localhost:8545'),
    core: throwsOnUnexpectedAccess({
      safeBlock: UNEXPECTED_ACCESS,
      sync: {
        batchSize: 6_000,
      },
    }),
  }
}

const UNEXPECTED_ACCESS = Symbol() as never
function throwsOnUnexpectedAccess<T extends object>(target: T): T {
  return new Proxy(target, {
    get: (target, key) => {
      const value = target[key as keyof typeof target]
      if (value === UNEXPECTED_ACCESS) {
        throw new Error(`Unexpected access to "${String(key)}"`)
      }
      return value
    },
  })
}
