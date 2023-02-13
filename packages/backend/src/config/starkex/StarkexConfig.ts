import { AssetId, EthereumAddress } from '@explorer/types'

export type StarkexConfig =
  | PerpetualRollupConfig
  | PerpetualValidiumConfig
  | SpotValidiumConfig

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
  collateralAsset: {
    assetId: AssetId
    price: bigint
  }
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
  collateralAsset: {
    assetId: AssetId
    price: bigint
  }
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
