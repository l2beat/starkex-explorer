import { TradingMode } from '@explorer/shared'

export function getTradingMode(): TradingMode {
  const projectName = process.env.STARKEX_INSTANCE ?? 'dydx-mainnet'

  switch (projectName) {
    case 'dydx-mainnet':
    case 'dydx-local':
      return 'perpetual'
    case 'myria-goerli':
      return 'spot'
    case 'gammax-goerli':
      return 'perpetual'
    default:
      throw new Error(`Unknown TRADING_MODE: ${projectName}`)
  }
}
