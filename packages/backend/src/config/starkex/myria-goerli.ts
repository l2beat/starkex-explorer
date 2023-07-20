import { EthereumAddress } from '@explorer/types'
import { Env } from '@l2beat/backend-tools'

import { StarkexConfig } from './StarkexConfig'

export function getMyriaGoerliConfig(env: Env): StarkexConfig {
  return {
    instanceName: 'Myria',
    dataAvailabilityMode: 'validium',
    tradingMode: 'spot',
    blockchain: {
      chainId: 5,
      jsonRpcUrl: env.string('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: env.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 6948455,
      maxBlockNumber: env.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    availabilityGateway: {
      getUrl: (batchId: number) => {
        return `${env.string('MYRIA_AG_URL')}?batch_id=${batchId}`
      },
      auth: {
        type: 'certificates',
        serverCertificate: env.string('MYRIA_AG_SERVER_CERTIFICATE'),
        userCertificate: env.string('MYRIA_AG_USER_CERTIFICATE'),
        userKey: env.string('MYRIA_AG_USER_KEY'),
      },
    },
    contracts: {
      perpetual: EthereumAddress('0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9'),
    },
  }
}
