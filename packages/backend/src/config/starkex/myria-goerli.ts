import { EthereumAddress } from '@explorer/types'

import { getEnv } from '../getEnv'
import { StarkexConfig } from './StarkexConfig'

export function getMyriaGoerliConfig(): StarkexConfig {
  return {
    dataAvailabilityMode: 'volition',
    tradingMode: 'spot',
    blockchain: {
      chainId: 5,
      jsonRpcUrl: getEnv('JSON_RPC_URL'),
      safeBlockDistance: 40,
      syncBatchSize: getEnv.integer('SYNC_BATCH_SIZE', 6_000),
      minBlockNumber: 6934760,
      maxBlockNumber: getEnv.integer('MAX_BLOCK_NUMBER', Infinity),
    },
    availabilityGateway: {
      url: getEnv('MYRIA_AG_URL'),
      serverCertificate: getEnv('MYRIA_AG_SERVER_CERTIFICATE'),
      userCertificate: getEnv('MYRIA_AG_USER_CERTIFICATE'),
      userKey: getEnv('MYRIA_AG_USER_KEY'),
    },
    contracts: {
        perpetual: EthereumAddress('0xF82C423a30E317f34f9b0997627F2F9c5d239Ad9'),
        registry: EthereumAddress('0xA9b7e2DCA4B7bD8161204C6c8A4e2DB3750dFd2e'),
        proxy: EthereumAddress('0x3071BE11F9e92A9eb28F305e1Fa033cD102714e7'),
        verifiers: [
          EthereumAddress('0xB1EDA32c467569fbDC8C3E041C81825D76b32b84'),
          EthereumAddress('0x894c4a12548FB18EaA48cF34f9Cd874Fc08b7FC3'),
        ],
    },
  }
}
