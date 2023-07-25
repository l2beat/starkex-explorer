import { AssetHash, AssetId, EthereumAddress } from '@explorer/types'
import { Env } from '@l2beat/backend-tools'

import { ClientAuth, StarkexConfig } from './StarkexConfig'

export function getApexGoerliConfig(env: Env): StarkexConfig {
  const clientAuth: ClientAuth = {
    type: 'bearerToken',
    bearerToken: env.string('APEX_BEARER_TOKEN'),
  }

  return {
    instanceName: 'ApeX',
    dataAvailabilityMode: 'validium',
    tradingMode: 'perpetual',
    blockchain: {
      chainId: 5,
      jsonRpcUrl: env.string('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: env.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 7160993,
      maxBlockNumber: env.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    contracts: {
      perpetual: EthereumAddress('0xB0fBAaE46907730D51A50B94704ce5aef13cB993'),
    },
    availabilityGateway: {
      getUrl: (batchId: number) => {
        return `${env.string('APEX_AG_URL')}?batchId=${batchId}`
      },
      auth: clientAuth,
    },
    l2Transactions: {
      enabled: true,
      excludeTypes: ['OraclePricesTick'],
      feederGateway: {
        getUrl: (batchId: number) => {
          return `${env.string('APEX_FG_URL')}?batchId=${batchId}`
        },
        auth: clientAuth,
      },
      liveApi: {
        getTransactionsUrl: (startId, expectCount) => {
          return `${env.string(
            'APEX_TRANSACTION_API_URL'
          )}?startApexId=${startId}&expectCount=${expectCount}`
        },
        getThirdPartyIdByTransactionIdUrl: (transactionId: number) => {
          return `${env.string(
            'APEX_THIRD_PARTY_ID_API_URL'
          )}?txId=${transactionId}`
        },
        auth: clientAuth,
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
