import { HardhatUserConfig, extendEnvironment } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { HardhatUtils } from "./src/utils"
import { config as dotenv } from 'dotenv'

dotenv()

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      chainId: 1,
      accounts: []
    },
  }
};

extendEnvironment((hre) => {
  const provider = new hre.ethers.providers.JsonRpcProvider()
  // @ts-ignore
  hre.utils = new HardhatUtils(provider, process.env.PERPETUAL_ADDRESS)
});

export default config;
