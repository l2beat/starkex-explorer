import '@nomicfoundation/hardhat-toolbox'

import { getEnv } from '@l2beat/backend-tools'
import { extendEnvironment, HardhatUserConfig } from 'hardhat/config'

import { HardhatUtils } from './src/utils'

const env = getEnv()

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    hardhat: {
      accounts: [],
      forking: {
        url: env.string('JSON_RPC_URL'),
      },
    },
  },
}

extendEnvironment((hre) => {
  const provider = new hre.ethers.providers.JsonRpcProvider()
  // @ts-expect-error
  hre.utils = new HardhatUtils(provider, env.string('PERPETUAL_ADDRESS'))
})

export default config
