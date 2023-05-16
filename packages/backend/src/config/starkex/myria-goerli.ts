import { EthereumAddress } from '@explorer/types'

import { getEnv } from '../getEnv'
import { StarkexConfig } from './StarkexConfig'

export function getMyriaGoerliConfig(): StarkexConfig {
  return {
    instanceName: 'Myria',
    dataAvailabilityMode: 'validium',
    tradingMode: 'spot',
    blockchain: {
      chainId: 5,
      jsonRpcUrl: getEnv('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 6948455,
      maxBlockNumber: getEnv.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    availabilityGateway: {
      getUrl: (batchId: number) => {
        return `${getEnv('MYRIA_AG_URL')}?batch_id=${batchId}`
      },
      auth: {
        type: 'certificates',
        serverCertificate: getEnv('MYRIA_AG_SERVER_CERTIFICATE'),
        userCertificate: getEnv('MYRIA_AG_USER_CERTIFICATE'),
        userKey: getEnv('MYRIA_AG_USER_KEY'),
      },
    },
    contracts: {
      perpetual: EthereumAddress('0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9'),
    },
  }
}
