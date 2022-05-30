import { Config } from './Config'
import { getLocalConfig } from './config.local'
import { getProductionConfig } from './config.production'
import { getTestConfig } from './config.testing'
import { getTestnetConfig } from './config.testnet'

export type { Config }

export function getConfig(env: string): Config {
  switch (env) {
    case 'local':
      return getLocalConfig()
    case 'testnet':
      return getTestnetConfig()
    case 'production':
      return getProductionConfig()
    case 'test':
      return getTestConfig()
  }
  throw new TypeError(`Unrecognized env: ${env}!`)
}
