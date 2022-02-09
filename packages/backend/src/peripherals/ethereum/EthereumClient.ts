import { assert } from 'console'
import { ethers, providers } from 'ethers'

import { BlockRange, Hash256 } from '../../model'
import { BlockTag } from './types'

export class EthereumClient {
  private provider = new ethers.providers.JsonRpcProvider(this.rpcUrl)

  constructor(private readonly rpcUrl: string) {}

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber()
  }

  async getBlock(blockTagOrHash: BlockTag): Promise<providers.Block> {
    return await this.provider.getBlock(blockTagOrHash)
  }

  async getLogs(filter: providers.Filter) {
    return await this.provider.getLogs(filter)
  }

  async getLogsInRange(blockRange: BlockRange, filter: providers.Filter) {
    if (blockRange.isEmpty()) {
      return []
    }
    const logs = await this.provider.getLogs({
      ...filter,
      fromBlock: blockRange.start,
      toBlock: blockRange.end - 1,
    })
    assert(blockRange.hasAll(logs), 'all logs must be from the block range')
    return logs
  }

  async getTransaction(transactionHash: Hash256) {
    return await this.provider.getTransaction(transactionHash.toString())
  }

  onBlock(handler: (block: providers.Block) => void) {
    this.provider.on('block', handler)
    return () => {
      this.provider.off('block', handler)
    }
  }
}
