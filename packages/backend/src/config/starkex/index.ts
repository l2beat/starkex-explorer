import { Env } from '@l2beat/backend-tools'
import { chain } from 'lodash'
import { StarkexConfig } from './StarkexConfig'
import { getApexGoerliConfig } from './apex-goerli'
import { getApexMainnetConfig } from './apex-mainnet'
import { getDydxLocalConfig } from './dydx-local'
import { getDydxMainnetConfig } from './dydx-mainnet'
import { getGammaxGoerliConfig } from './gammax-goerli'
import { getMyriaGoerliConfig } from './myria-goerli'

export function getStarkexConfig(env: Env): StarkexConfig {
  const instance = env.string('STARKEX_INSTANCE')
  switch (instance) {
    case 'dydx-mainnet':
      return getDydxMainnetConfig(env)
    case 'dydx-local':
      return getDydxLocalConfig(env)
    case 'gammax-goerli':
      return getGammaxGoerliConfig(env)
    case 'myria-goerli':
      return getMyriaGoerliConfig(env)
    case 'apex-goerli':
      return getApexGoerliConfig(env)
    case 'apex-mainnet':
      return getApexMainnetConfig(env)
  }
  throw new Error(`Unrecognized chain: ${chain}`)
}
