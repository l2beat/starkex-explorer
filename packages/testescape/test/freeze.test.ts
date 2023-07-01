import { expect } from 'earl'
import { ethers, network } from 'hardhat'
import * as helpers from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getEnv } from '../src/getEnv'
import { config as dotenv } from 'dotenv'
import { getKnex, getLastSyncedBlock } from '../src/utils'
dotenv()

const knex = getKnex()

async function forkNetworkAtBlock(blockNumber: number) {
    const url = getEnv('JSON_RPC_URL')
    await helpers.reset(url, blockNumber);
}

describe("freeze functionality", function () {
  it.only("should trigger freeze", async function () {
    const perpetualAddress = getEnv('PERPETUAL_ADDRESS')
    const blockNumber = await getLastSyncedBlock(knex)

    // Fork the mainnet at the block to which explorer is synced
    await forkNetworkAtBlock(blockNumber)

    // Prepare the perpetual contract
    const provider = new ethers.providers.Web3Provider(network.provider as any)
    const abi = [
      "function isFrozen() public view returns (bool)",
      "function forcedWithdrawalRequest(uint256,uint256,uint256,bool) external",
      "function freezeRequest(uint256,uint256,uint256) external"
    ]
    const contract = new ethers.Contract(perpetualAddress, abi, provider)

    // The exchange should not be frozen
    expect(await contract.isFrozen()).toEqual(false)

    // Forced withdrawal data (for user at Position #1)
    const starkKey = '0x027cda895fbaa174bf10c8e0f57561fa9aa6a93cfec32b87f1bdfe55a161e358'
    const ethereumAddress = '0x271bdA3c58B9C1e6016d1256Dad1C8C3Ca0590eF'
    const positionId = 1;
    const quantizedAmount = 10 * (10 ** 6);
    const premiumCost = false

    // Impersonate the user
    await helpers.impersonateAccount(ethereumAddress)

    // Give them some eth for gas
    await helpers.setBalance(ethereumAddress, 5n * (10n ** 18n))

    // Send forcedWithdrawalRequiest
    const signer = provider.getSigner(ethereumAddress); // Use the correct signer here
    const contractWithSigner = contract.connect(signer);
    await contractWithSigner.forcedWithdrawalRequest(starkKey, positionId, quantizedAmount, premiumCost);

    // Send freeze request (it should fail, it's too soon)
    await expect(contractWithSigner.freezeRequest(starkKey, positionId, quantizedAmount)).toBeRejected()

    // Mine 20 blocks with 1 day interval (7 days is the limit to freeze)
    await helpers.mine(20, { interval: 24 * 60 * 60 })

    // Send freeze request (it should work now)
    await contractWithSigner.freezeRequest(starkKey, positionId, quantizedAmount)
    
    // The exchange should be frozen now!
    expect(await contract.isFrozen()).toEqual(true)
  });
});