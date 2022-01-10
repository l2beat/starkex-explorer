import { ethers } from 'ethers'

import { Block, BlockTag } from './types'

export class EthereumClient {
  private provider = new ethers.providers.JsonRpcProvider()

  constructor() {}

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber()
  }

  async getBlock(blockTagOrHash: BlockTag): Promise<Block> {
    return await this.provider.getBlock(blockTagOrHash)
  }
}
