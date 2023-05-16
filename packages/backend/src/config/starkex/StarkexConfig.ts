import { CollateralAsset, InstanceName, TradingMode } from '@explorer/shared'
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
  instanceName: InstanceName
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
  instanceName: InstanceName
  dataAvailabilityMode: 'validium'
  tradingMode: 'perpetual'
  blockchain: BlockchainConfig
  availabilityGateway: GatewayConfig
  feederGateway: GatewayConfig | undefined
  contracts: {
    perpetual: EthereumAddress
  }
  collateralAsset: CollateralAsset
}

export interface SpotValidiumConfig {
  instanceName: InstanceName
  dataAvailabilityMode: 'validium'
  tradingMode: 'spot'
  blockchain: BlockchainConfig
  availabilityGateway: GatewayConfig
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

export interface GatewayConfig {
  url: string
  queryParam: string
  auth:
    | {
        type: 'certificates'
        serverCertificate: string
        userCertificate: string
        userKey: string
      }
    | {
        type: 'bearerToken'
        bearerToken: string
      }
}
