import { EthereumAddress, Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { BlockRange } from '../model'
import {
  PageRecord,
  PageRepository,
} from '../peripherals/database/PageRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'

const REGISTRY_ABI = new utils.Interface([
  'event LogMemoryPageFactContinuous(bytes32 factHash, uint256 memoryHash, uint256 prod)',
])

/** @internal exported only for tests */
export const PAGE_ABI = new utils.Interface([
  'function registerContinuousMemoryPage(uint256 startAddr, uint256[] values, uint256 z, uint256 alpha, uint256 prime)',
])

/** @internal exported only for tests */
export const LOG_MEMORY_PAGE_FACT_CONTINUOUS = REGISTRY_ABI.getEventTopic(
  'LogMemoryPageFactContinuous'
)

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
      topics: [LOG_MEMORY_PAGE_FACT_CONTINUOUS],
    })
    return logs.map((log): MemoryPageEvent => {
      const event = REGISTRY_ABI.parseLog(log)
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
