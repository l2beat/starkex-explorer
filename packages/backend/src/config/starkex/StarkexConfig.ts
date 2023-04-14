import { CollateralAsset, TradingMode } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

type CheckTradingMode<T extends { tradingMode: TradingMode }> = Exclude<
  T['tradingMode'],
  TradingMode
> extends never
  ? T
  : never

export type StarkexConfig = CheckTradingMode<
  PerpetualRollupConfig | PerpetualValidiumConfig | SpotValidiumConfig
>

export interface PerpetualRollupConfig {
  dataAvailabilityMode: 'rollup'
  tradingMode: 'perpetual'
  blockchain: BlockchainConfig
  contracts: {
    perpetual: EthereumAddress
    registry: EthereumAddress
    proxy: EthereumAddress
    verifiers: EthereumAddress[]
  }
  collateralAsset: CollateralAsset
}

export interface PerpetualValidiumConfig {
  dataAvailabilityMode: 'validium'
  tradingMode: 'perpetual'
  blockchain: BlockchainConfig
  availabilityGateway: {
    url: string
    serverCertificate: string
    userCertificate: string
    userKey: string
  }
  contracts: {
    perpetual: EthereumAddress
  }
  collateralAsset: CollateralAsset
}

export interface SpotValidiumConfig {
  dataAvailabilityMode: 'validium'
  tradingMode: 'spot'
  blockchain: BlockchainConfig
  availabilityGateway: {
    url: string
    serverCertificate: string
    userCertificate: string
    userKey: string
  }
  contracts: {
    perpetual: EthereumAddress
  }
}

export interface BlockchainConfig {
  chainId: number
  jsonRpcUrl: string
  safeBlockDistance: number
  syncBatchSize: number
  minBlockNumber: number
  maxBlockNumber: number
}
