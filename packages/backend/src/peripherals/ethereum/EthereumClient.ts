import { EthereumAddress, Hash256 } from '@explorer/types'
import { ethers, providers } from 'ethers'

import { BlockRange } from '../../model'
import { HackFilter, HackJsonRpcProvider } from './HackJsonRpcProvider'
import { BlockTag } from './types'

export class EthereumClient {
  private provider: HackJsonRpcProvider

  constructor(
    rpcUrlOrProvider: string | HackJsonRpcProvider,
    private readonly safeBlockDistance: number
  ) {
    this.provider =
      typeof rpcUrlOrProvider === 'string'
        ? new HackJsonRpcProvider(rpcUrlOrProvider)
        : rpcUrlOrProvider
  }

  async getChainId(): Promise<number> {
    const network = await this.provider.getNetwork()
    return network.chainId
  }

  async assertChainId(expected: number) {
    const actual = await this.getChainId()
    if (actual !== expected) {
      throw new Error(`Expected chain id ${actual} to be ${expected}`)
    }
  }

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

  async getBlockTimestamp(blockNumber: number): Promise<number> {
    const block = await this.getBlock(blockNumber)
    return block.timestamp
  }

  async getLogs(filter: HackFilter) {
    return await this.provider.getLogs(filter)
  }

  async getLogsInRange(blockRange: BlockRange, filter: HackFilter) {
    if (blockRange.isEmpty()) {
      return []
    }
    // eslint-disable-next-line prefer-const
    let [from, to, hashes] = blockRange.splitByKnownHashes()
    if (hashes.length > this.safeBlockDistance) {
      to += hashes.length - this.safeBlockDistance
      hashes = hashes.slice(-this.safeBlockDistance)
    }

    const filters: HackFilter[] = []
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

  private async getManyLogs(filters: HackFilter[]) {
    const batches: HackFilter[][] = []
    while (filters.length > 0) {
      batches.push(filters.splice(0, 10))
    }
    const logs: providers.Log[] = []
    for (const batch of batches) {
      const nestedLogs = await Promise.all(
        batch.map((filter) => {
          if (
            'fromBlock' in filter &&
            typeof filter.address === 'string' &&
            typeof filter.fromBlock === 'number' &&
            typeof filter.toBlock === 'number'
          ) {
            return this.getAllLogs(
              filter.address,
              filter.topics,
              filter.fromBlock,
              filter.toBlock
            )
          }
          return this.provider.getLogs(filter)
        })
      )
      logs.push(...nestedLogs.flat())
    }
    return logs
  }

  async getAllLogs(
    address: string,
    topics: (string | string[] | null)[] | undefined,
    fromBlock: number,
    toBlock: number
  ): Promise<providers.Log[]> {
    if (fromBlock === toBlock) {
      return await this.provider.getLogs({
        address: address.toString(),
        topics,
        fromBlock,
        toBlock,
      })
    }
    try {
      return await this.provider.getLogs({
        address: address.toString(),
        topics,
        fromBlock,
        toBlock,
      })
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes('Log response size exceeded')
      ) {
        const midPoint = fromBlock + Math.floor((toBlock - fromBlock) / 2)
        const [a, b] = await Promise.all([
          this.getAllLogs(address, topics, fromBlock, midPoint),
          this.getAllLogs(address, topics, midPoint + 1, toBlock),
        ])
        return a.concat(b)
      } else {
        throw e
      }
    }
  }

  async getTransaction(
    transactionHash: Hash256
  ): Promise<providers.TransactionResponse | undefined> {
    const tx = await this.provider.getTransaction(transactionHash.toString())
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!tx) {
      return undefined
    }
    return tx
  }

  async getTransactionReceipt(
    transactionHash: Hash256
  ): Promise<providers.TransactionReceipt> {
    return await this.provider.getTransactionReceipt(transactionHash.toString())
  }

  getContract(address: string, abi: string[]) {
    return new ethers.Contract(address, abi, this.provider)
  }

  async call(address: EthereumAddress, data: string): Promise<string> {
    return await this.provider.call({ to: address.toString(), data })
  }

  onBlock(handler: (block: providers.Block | number) => void) {
    this.provider.on('block', handler)
    return () => {
      this.provider.off('block', handler)
    }
  }
}
