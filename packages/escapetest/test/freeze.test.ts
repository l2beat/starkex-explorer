import { expect } from 'earl'
// import { ethers } from 'hardhat'
import { reset } from '@nomicfoundation/hardhat-network-helpers'
import { getEnv } from '../src/getEnv'
import { config as dotenv } from 'dotenv'
import { getKnex, getLastSyncedBlock } from '../src/utils'
dotenv()

const knex = getKnex()

async function forkNetworkAtBlock(blockNumber: number) {
    const url = getEnv('JSON_RPC_URL')
    await reset(url, blockNumber);
}

describe("freeze functionality", function () {
  it("should trigger freeze", async function () {
    const blockNumber = await getLastSyncedBlock(knex)
    await forkNetworkAtBlock(blockNumber)
    expect(blockNumber).toBeGreaterThan(0)
  });
});