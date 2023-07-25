import { AssetHash, AssetId, EthereumAddress } from '@explorer/types'
import { Env } from '@l2beat/backend-tools'

import { StarkexConfig } from './StarkexConfig'

export function getDydxLocalConfig(env: Env): StarkexConfig {
  return {
    instanceName: 'dYdX',
    dataAvailabilityMode: 'rollup',
    tradingMode: 'perpetual',
    blockchain: {
      chainId: 1337,
      jsonRpcUrl: 'http://127.0.0.1:8545',
      safeBlockDistance: 5,
      syncBatchSize: env.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 0,
      maxBlockNumber: env.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    l2Transactions: { enabled: false },
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
      assetHash: AssetHash(
        '0x02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d'
      ),
      price: 1_000_000n,
    },
  }
}
