import { AssetHash, AssetId, EthereumAddress } from '@explorer/types'
import { Env } from '@l2beat/backend-tools'

import { StarkexConfig } from './StarkexConfig'

export function getDydxMainnetConfig(env: Env): StarkexConfig {
  return {
    instanceName: 'dYdX',
    dataAvailabilityMode: 'rollup',
    tradingMode: 'perpetual',
    blockchain: {
      chainId: 1,
      jsonRpcUrl: env.string('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: env.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 11813207,
      maxBlockNumber: env.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    contracts: {
      perpetual: EthereumAddress('0xD54f502e184B6B739d7D27a6410a67dc462D69c8'),
      escapeVerifier: EthereumAddress(
        '0x626211C1e9BC633f4D342Af99f4E8bc93f11F3DD'
      ),
      registry: EthereumAddress('0xEfbCcE4659db72eC6897F46783303708cf9ACef8'),
      proxy: EthereumAddress('0xC8c212f11f6ACca77A7afeB7282dEBa5530eb46C'),
      verifiers: [
        EthereumAddress('0xB1EDA32c467569fbDC8C3E041C81825D76b32b84'),
        EthereumAddress('0x894c4a12548FB18EaA48cF34f9Cd874Fc08b7FC3'),
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
