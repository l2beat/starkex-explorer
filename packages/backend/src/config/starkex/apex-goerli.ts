import { AssetHash, AssetId, EthereumAddress } from '@explorer/types'

import { getEnv } from '../getEnv'
import { StarkexConfig } from './StarkexConfig'

export function getApexGoerliConfig(): StarkexConfig {
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
      url: getEnv('APEX_AG_URL'),
      queryParam: getEnv('APEX_AG_QUERY_PARAM'),
      auth: {
        type: 'bearerToken',
        bearerToken: getEnv('APEX_AG_BEARER_TOKEN'),
      },
    },
    feederGateway: {
      url: getEnv('APEX_FG_URL'),
      queryParam: getEnv('APEX_FG_QUERY_PARAM'),
      auth: {
        type: 'bearerToken',
        bearerToken: getEnv('APEX_FG_BEARER_TOKEN'),
      },
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
