import { AssetHash, AssetId, EthereumAddress } from '@explorer/types'

import { getEnv } from '../getEnv'
import { ClientAuth, StarkexConfig } from './StarkexConfig'

export function getApexGoerliConfig(): StarkexConfig {
  const clientAuth: ClientAuth = {
    type: 'bearerToken',
    bearerToken: getEnv('APEX_BEARER_TOKEN'),
  }

  return {
    instanceName: 'ApeX',
    dataAvailabilityMode: 'validium',
    tradingMode: 'perpetual',
    blockchain: {
      chainId: 5,
      jsonRpcUrl: getEnv('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 7160993,
      maxBlockNumber: getEnv.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    contracts: {
      perpetual: EthereumAddress('0xB0fBAaE46907730D51A50B94704ce5aef13cB993'),
    },
    availabilityGateway: {
      getUrl: (batchId: number) => {
        return `${getEnv('APEX_AG_URL')}?batchId=${batchId}`
      },
      auth: clientAuth,
    },
    feederGateway: {
      getUrl: (batchId: number) => {
        return `${getEnv('APEX_FG_URL')}?batchId=${batchId}`
      },
      auth: clientAuth,
    },
    transactionApi: {
      getUrl: (startId, expectCount) => {
        return `${getEnv(
          'APEX_TRANSACTION_API_URL'
        )}?startApexId=${startId}&expectCount=${expectCount}`
      },
      auth: clientAuth,
    },
    collateralAsset: {
      assetId: AssetId('SLF-6'),
      assetHash: AssetHash(
        '0x00a21edc9d9997b1b1956f542fe95922518a9e28ace11b7b2972a1974bf5971f'
      ),
      price: 1_000_000n,
    },
  }
}
