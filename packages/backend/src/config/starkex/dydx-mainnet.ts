import { EthereumAddress } from '@explorer/types'

import { getEnv } from '../getEnv'
import { StarkexConfig } from './StarkexConfig'

export function getDydxMainnetConfig(): StarkexConfig {
  return {
    dataAvailabilityMode: 'rollup',
    tradingMode: 'perpetual',
    blockchain: {
      chainId: 1,
      jsonRpcUrl: getEnv('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 11813207,
      maxBlockNumber: getEnv.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    contracts: {
      perpetual: EthereumAddress('0xD54f502e184B6B739d7D27a6410a67dc462D69c8'),
      registry: EthereumAddress('0xEfbCcE4659db72eC6897F46783303708cf9ACef8'),
      proxy: EthereumAddress('0xC8c212f11f6ACca77A7afeB7282dEBa5530eb46C'),
      verifiers: [
        EthereumAddress('0xB1EDA32c467569fbDC8C3E041C81825D76b32b84'),
        EthereumAddress('0x894c4a12548FB18EaA48cF34f9Cd874Fc08b7FC3'),
      ],
    },
  }
}
