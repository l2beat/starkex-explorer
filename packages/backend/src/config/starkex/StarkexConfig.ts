import { CollateralAsset, InstanceName, TradingMode } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

type CheckTradingMode<T extends { tradingMode: TradingMode }> = Exclude<
  T['tradingMode'],
  TradingMode
> extends never
  ? T
  : never

export type StarkexConfig<T extends TradingMode = TradingMode> =
  CheckTradingMode<
    T extends 'perpetual'
      ? PerpetualRollupConfig | PerpetualValidiumConfig
      : T extends 'spot'
      ? SpotValidiumConfig
      : PerpetualRollupConfig | PerpetualValidiumConfig | SpotValidiumConfig
  >

export interface PerpetualRollupConfig {
  instanceName: InstanceName
  dataAvailabilityMode: 'rollup'
  tradingMode: 'perpetual'
  blockchain: BlockchainConfig
  contracts: {
    perpetual: EthereumAddress
    escapeVerifier: EthereumAddress
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
  l2TransactionApi: L2TransactionApiConfig | undefined
  contracts: {
    perpetual: EthereumAddress
    escapeVerifier: EthereumAddress
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
    escapeVerifier: EthereumAddress
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

export type ClientAuth =
  | {
      type: 'bearerToken'
      bearerToken: string
    }
  | {
      type: 'certificates'
      serverCertificate: string
      userCertificate: string
      userKey: string
    }

export interface GatewayConfig {
  getUrl: (batchId: number) => string
  auth: ClientAuth
}

export interface L2TransactionApiConfig {
  getUrl: (startApexId: number, expectCount: number) => string
  auth: ClientAuth
}
