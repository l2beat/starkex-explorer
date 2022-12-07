import { EthereumAddress } from '@explorer/types'

export type StarkexConfig = PerpetualRollupConfig | PerpetualValidiumConfig | SpotVolitionConfig;

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
}

export interface SpotVolitionConfig {
  dataAvailabilityMode: 'volition'
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
    registry: EthereumAddress
    proxy: EthereumAddress
    verifiers: EthereumAddress[]
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
