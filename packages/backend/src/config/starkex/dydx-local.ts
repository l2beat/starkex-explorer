import { AssetId, EthereumAddress } from '@explorer/types'

import { getEnv } from '../getEnv'
import { StarkexConfig } from './StarkexConfig'

export function getDydxLocalConfig(): StarkexConfig {
  return {
    instanceName: 'dYdX',
    dataAvailabilityMode: 'rollup',
    tradingMode: 'perpetual',
    blockchain: {
      chainId: 1337,
      jsonRpcUrl: 'http://127.0.0.1:8545',
      safeBlockDistance: 5,
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 0,
      maxBlockNumber: getEnv.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    contracts: {
      perpetual: EthereumAddress('0x27fac828D6E6862901ea8471fF22552D84e155D0'),
      registry: EthereumAddress('0xE068d37a67cAb19e0A6DFE88e720f076cfA7140E'),
      proxy: EthereumAddress.ZERO,
      verifiers: [
        EthereumAddress('0x6ebcf3c79b5bC9195F26dE459f57B6d2f0f27861'),
      ],
    },
    collateralAsset: {
      assetId: AssetId('USDC-6'),
      price: 1_000_000n,
    },
  }
}
