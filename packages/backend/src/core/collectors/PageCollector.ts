import { EthereumAddress, Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { BlockRange } from '../../model'
import {
  PageRecord,
  PageRepository,
} from '../../peripherals/database/PageRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { LogMemoryPageFactContinuous } from './events'

/** @internal exported only for tests */
export const PAGE_ABI = new utils.Interface([
  'function registerContinuousMemoryPage(uint256 startAddr, uint256[] values, uint256 z, uint256 alpha, uint256 prime)',
])

export class PageCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly pageRepository: PageRepository,
    private readonly registryAddress: EthereumAddress
  ) {}

  async collect(blockRange: BlockRange): Promise<Omit<PageRecord, 'id'>[]> {
    const memoryPageEvents = await this.getMemoryPageEvents(blockRange)

    const records = await Promise.all(
      memoryPageEvents.map(
        async ({
          memoryHash,
          transactionHash,
        }): Promise<Omit<PageRecord, 'id'>> => {
          const tx = await this.ethereumClient.getTransaction(transactionHash)

          if (!tx) {
            throw new Error('Transaction does not exist')
          }

          const decoded = PAGE_ABI.decodeFunctionData(
            'registerContinuousMemoryPage',
            tx.data
          )

          const values = decoded[1] as BigNumber[]
          const data = values.map(bignumToPaddedString).join('')

          return {
            data,
            pageHash: memoryHash,
            blockNumber: tx.blockNumber ?? blockRange.start,
          }
        }
      )
    )

    await this.pageRepository.addMany(records)
    return records
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.pageRepository.deleteAfter(lastToKeep)
  }

  private async getMemoryPageEvents(
    blockRange: BlockRange
  ): Promise<MemoryPageEvent[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.registryAddress.toString(),
      topics: [LogMemoryPageFactContinuous.topic],
    })
    return logs.map((log): MemoryPageEvent => {
      const event = LogMemoryPageFactContinuous.parseLog(log)
      return {
        memoryHash: Hash256.from(event.args.memoryHash),
        transactionHash: Hash256(log.transactionHash),
      }
    })
  }
}

interface MemoryPageEvent {
  memoryHash: Hash256
  transactionHash: Hash256
}

/** @internal */
export function bignumToPaddedString(x: BigNumber): string {
  return x.toHexString().substring(2).padStart(64, '0')
}
