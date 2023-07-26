import { AssetHash, AssetId, EthereumAddress } from '@explorer/types'
import { Env } from '@l2beat/backend-tools'

import { StarkexConfig } from './StarkexConfig'

export function getGammaxGoerliConfig(env: Env): StarkexConfig {
  return {
    instanceName: 'GammaX',
    dataAvailabilityMode: 'validium',
    tradingMode: 'perpetual',
    blockchain: {
      chainId: 5,
      jsonRpcUrl: env.string('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: env.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 6934760,
      maxBlockNumber: env.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    contracts: {
      perpetual: EthereumAddress('0x6E5de338D71af33B57831C5552775f54394d181B'),
      escapeVerifier: EthereumAddress.ZERO, // it actually is ZERO
    },
    l2Transactions: {
      enabled: false,
    },
    availabilityGateway: {
      getUrl: (batchId: number) => {
        return `${env.string('GAMMAX_AG_URL')}?batch_id=${batchId}`
      },
      auth: {
        type: 'certificates',
        serverCertificate: env.string('GAMMAX_AG_SERVER_CERTIFICATE'),
        userCertificate: env.string('GAMMAX_AG_USER_CERTIFICATE'),
        userKey: env.string('GAMMAX_AG_USER_KEY'),
      },
    },
    collateralAsset: {
      assetId: AssetId('COLLATERAL-1'),
      assetHash: AssetHash(
        '0xa21edc9d9997b1b1956f542fe95922518a9e28ace11b7b2972a1974bf5971f'
      ),
      price: 1n,
    },
  }
}
