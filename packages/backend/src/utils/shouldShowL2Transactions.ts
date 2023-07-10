import { Config } from '../config'

export const shouldShowL2Transactions = (config: Config) => {
  return (
    config.starkex.dataAvailabilityMode === 'validium' &&
    config.starkex.tradingMode === 'perpetual' &&
    !!config.starkex.feederGateway
  )
}
