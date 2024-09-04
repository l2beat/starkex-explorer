import { Env } from '@l2beat/backend-tools'

import { Config } from './Config'
import { getLocalConfig } from './environments/config.local'
import { getProductionConfig } from './environments/config.production'
import { getStagingConfig } from './environments/config.staging'

export type { Config }

export function getConfig(env: Env): Config {
  const deploymentEnv = env.string('DEPLOYMENT_ENV', 'local')
  switch (deploymentEnv) {
    case 'local':
      return getLocalConfig(env)
    case 'staging':
      return getStagingConfig(env)
    case 'production':
      return getProductionConfig(env)
  }
  throw new TypeError(`Unrecognized deployment env: ${deploymentEnv}!`)
}
