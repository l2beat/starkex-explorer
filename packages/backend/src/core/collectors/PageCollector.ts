import { EthereumAddress, Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { BlockRange } from '../../model'
import { PageRepository } from '../../peripherals/database/PageRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { LogMemoryPageFactContinuous } from './events'

export interface PageEvent {
  blockNumber: number
  pageHash: Hash256
  data: string
}

export class PageCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly pageRepository: PageRepository,
    private readonly registryAddress: EthereumAddress
  ) {}

  async collect(blockRange: BlockRange): Promise<PageEvent[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.registryAddress.toString(),
      topics: [LogMemoryPageFactContinuous.topic],
    })
    const records = await Promise.all(
      logs.map(async (log) => {
        const event = LogMemoryPageFactContinuous.parseLog(log)
        const transactionHash = Hash256(log.transactionHash)
        const data = await this.getTransactionData(transactionHash)
        return {
          pageHash: Hash256.from(event.args.memoryHash),
          blockNumber: log.blockNumber,
          data,
        }
      })
    )
    await this.pageRepository.addMany(records)
    return records
  }

  private async getTransactionData(transactionHash: Hash256) {
    const tx = await this.ethereumClient.getTransaction(transactionHash)
    if (!tx) {
      throw new Error('Transaction does not exist')
    }

    const decoded = PAGE_TRANSACTION_ABI.decodeFunctionData(
      'registerContinuousMemoryPage',
      tx.data
    ) as [BigNumber, BigNumber[], BigNumber, BigNumber, BigNumber]

    return decoded[1]
      .map((x) => x.toHexString().substring(2).padStart(64, '0'))
      .join('')
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.pageRepository.deleteAfter(lastToKeep)
  }
}

/** @internal exported only for tests */
export const PAGE_TRANSACTION_ABI = new utils.Interface([
  'function registerContinuousMemoryPage(uint256 startAddr, uint256[] values, uint256 z, uint256 alpha, uint256 prime)',
])
