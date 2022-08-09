import { Hash256 } from '@explorer/types'
import { ethers, providers } from 'ethers'

import { BlockRange } from '../../model'
import { BlockTag } from './types'

export function isReverted(
  receipt: ethers.providers.TransactionReceipt
): boolean {
  return receipt.status === 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Filter = providers.JsonRpcProvider['getLogs'] extends (arg: infer T) => any
  ? T
  : never

export class EthereumClient {
  private provider = new ethers.providers.JsonRpcProvider(this.rpcUrl)

  constructor(
    private readonly rpcUrl: string,
    private readonly safeBlockDistance: number
  ) {}

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber()
  }

  async getBlock(blockTagOrHash: BlockTag | Hash256): Promise<providers.Block> {
    return await this.provider.getBlock(
      typeof blockTagOrHash === 'number'
        ? blockTagOrHash
        : blockTagOrHash.toString()
    )
  }

  async getLogs(filter: providers.Filter) {
    return await this.provider.getLogs(filter)
  }

  async getLogsInRange(blockRange: BlockRange, filter: providers.Filter) {
    if (blockRange.isEmpty()) {
      return []
    }
    let [from, to, hashes] = blockRange.splitByKnownHashes()
    if (hashes.length > this.safeBlockDistance) {
      to += hashes.length - this.safeBlockDistance
      hashes = hashes.slice(-this.safeBlockDistance)
    }

    const filters: Filter[] = []
    if (from !== to) {
      filters.push({ ...filter, fromBlock: from, toBlock: to - 1 })
    }
    for (const hash of hashes) {
      filters.push({ ...filter, blockHash: hash.toString() })
    }
    const logs = await this.getManyLogs(filters)

    if (!blockRange.hasAll(logs)) {
      throw new Error('all logs must be from the block range')
    }
    return logs
  }

  private async getManyLogs(filters: Filter[]) {
    const batches: Filter[][] = []
    while (filters.length > 0) {
      batches.push(filters.splice(0, 10))
    }
    const logs: providers.Log[] = []
    for (const batch of batches) {
      const nestedLogs = await Promise.all(
        batch.map((filter) => this.provider.getLogs(filter))
      )
      logs.push(...nestedLogs.flat())
    }
    return logs
  }

  async getTransaction(
    transactionHash: Hash256
  ): Promise<ethers.providers.TransactionResponse | undefined> {
    const tx = await this.provider.getTransaction(transactionHash.toString())
    if (!tx) {
      return undefined
    }
    return tx
  }

  async getTransactionReceipt(transactionHash: Hash256) {
    return await this.provider.getTransactionReceipt(transactionHash.toString())
  }

  onBlock(handler: (block: providers.Block | number) => void) {
    this.provider.on('block', handler)
    return () => {
      this.provider.off('block', handler)
    }
  }
}
