import { AssetHash, AssetId, EthereumAddress } from '@explorer/types'
import { Env } from '@l2beat/backend-tools'

import { ClientAuth, StarkexConfig } from './StarkexConfig'

export function getApexMainnetConfig(env: Env): StarkexConfig {
  const clientAuth: ClientAuth = {
    type: 'bearerToken',
    bearerToken: env.string('APEX_BEARER_TOKEN'),
  }

  return {
    instanceName: 'ApeX',
    dataAvailabilityMode: 'validium',
    tradingMode: 'perpetual',
    blockchain: {
      chainId: 1,
      jsonRpcUrl: env.string('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: env.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 15322966,
      maxBlockNumber: env.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    contracts: {
      perpetual: EthereumAddress('0xA1D5443F2FB80A5A55ac804C948B45ce4C52DCbb'),
    },
    availabilityGateway: {
      getUrl: (batchId: number) => {
        return `${env.string('APEX_AG_URL')}?batchId=${batchId}`
      },
      auth: clientAuth,
    },
    feederGateway: {
      getUrl: (batchId: number) => {
        return `${env.string('APEX_FG_URL')}?batchId=${batchId}`
      },
      auth: clientAuth,
    },
    l2TransactionApi: {
      getUrl: (startId, expectCount) => {
        return `${env.string(
          'APEX_TRANSACTION_API_URL'
        )}?startApexId=${startId}&expectCount=${expectCount}`
      },
      auth: clientAuth,
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
