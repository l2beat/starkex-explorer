import { CollateralAsset, InstanceName, TradingMode } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

export type StarkexConfig<T extends TradingMode = TradingMode> =
  T extends 'perpetual'
    ? PerpetualRollupConfig | PerpetualValidiumConfig
    : T extends 'spot'
    ? SpotValidiumConfig
    : PerpetualRollupConfig | PerpetualValidiumConfig | SpotValidiumConfig

type BaseConfig<T extends TradingMode, D extends 'rollup' | 'validium'> = {
  instanceName: InstanceName
  dataAvailabilityMode: D
  tradingMode: T
  blockchain: BlockchainConfig
} & L2TransactionsConfig

export type PerpetualRollupConfig = BaseConfig<'perpetual', 'rollup'> & {
  contracts: {
    perpetual: EthereumAddress
    registry: EthereumAddress
    proxy: EthereumAddress
    verifiers: EthereumAddress[]
  }
  collateralAsset: CollateralAsset
}

export type PerpetualValidiumConfig = BaseConfig<'perpetual', 'validium'> & {
  availabilityGateway: GatewayConfig
  contracts: {
    perpetual: EthereumAddress
  }
  collateralAsset: CollateralAsset
}

export type SpotValidiumConfig = BaseConfig<'spot', 'validium'> & {
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

export type L2TransactionsConfig =
  | {
      enableL2Transactions: true
      feederGateway: GatewayConfig
      l2TransactionApi: LiveL2TransactionApiConfig | undefined
    }
  | {
      enableL2Transactions: false
      feederGateway?: GatewayConfig
      l2TransactionApi?: LiveL2TransactionApiConfig
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

export interface LiveL2TransactionApiConfig {
  getTransactionsUrl: (startApexId: number, expectCount: number) => string
  getThirdPartyIdByTransactionIdUrl: (transactionId: number) => string
  auth: ClientAuth
}
