import { Config } from './Config'
import { getLocalConfig } from './environments/config.local'
import { getProductionConfig } from './environments/config.production'
import { getStagingConfig } from './environments/config.staging'

export type { Config }

export function getConfig(env: string): Config {
  switch (env) {
    case 'local':
      return getLocalConfig()
    case 'staging':
      return getStagingConfig()
    case 'production':
      return getProductionConfig()
  }
  throw new TypeError(`Unrecognized env: ${env}!`)
}
