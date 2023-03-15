import { TradingMode } from "@explorer/shared"

export type InstanceName = 'dYdX' | 'Myria' | 'GammaX'

export function getInstanceName(): InstanceName {
  const projectName = process.env.STARKEX_INSTANCE ?? 'dydx-mainnet'

  switch (projectName) {
    case 'dydx-mainnet':
      return 'dYdX'
    case 'myria-goerli':
      return 'Myria'
    case 'gammax-goerli':
      return 'GammaX'
    default:
      throw new Error(`Unknown STARKEX_INSTANCE: ${projectName}`)
  }
}

export function getTradingMode(): TradingMode {
  const projectName = process.env.STARKEX_INSTANCE ?? 'dydx-mainnet'

  switch (projectName) {
    case 'dydx-mainnet':
      return 'perpetual'
    case 'myria-goerli':
      return 'spot'
    case 'gammax-goerli':
      return 'perpetual'
    default:
      throw new Error(`Unknown TRADING_MODE: ${projectName}`)
  }
}
