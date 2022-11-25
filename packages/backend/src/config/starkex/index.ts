import { getDydxLocalConfig } from './dydx-local'
import { getDydxMainnetConfig } from './dydx-mainnet'
import { StarkexConfig } from './StarkexConfig'

export function getStarkexConfig(chain: string): StarkexConfig {
  switch (chain) {
    case 'dydx-mainnet':
      return getDydxMainnetConfig()
    case 'dydx-local':
      return getDydxLocalConfig()
  }
  throw new Error(`Unrecognized chain: ${chain}`)
}
