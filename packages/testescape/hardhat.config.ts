import '@nomicfoundation/hardhat-toolbox'

import { getEnv } from '@l2beat/backend-tools'
import { config as dotenv } from 'dotenv'
import { extendEnvironment, HardhatUserConfig } from 'hardhat/config'

import { HardhatUtils } from './src/utils'

dotenv()

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    hardhat: {
      chainId: 1,
      accounts: [],
    },
  },
}

extendEnvironment((hre) => {
  const provider = new hre.ethers.providers.JsonRpcProvider()
  const env = getEnv()
  // @ts-expect-error
  hre.utils = new HardhatUtils(provider, env.string('PERPETUAL_ADDRESS'))
})

export default config
