import { BigNumber, utils } from 'ethers'
import { writeFile } from 'fs/promises'
import { resolve } from 'path'

import {
  PageRecord,
  PageRepository,
} from '../peripherals/database/PageRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber, BlockRange } from '../peripherals/ethereum/types'

const REGISTRY_ABI = new utils.Interface([
  'event LogMemoryPageFactContinuous(bytes32 factHash, uint256 memoryHash, uint256 prod)',
])

const REGISTRY_ADDRESS = '0xEfbCcE4659db72eC6897F46783303708cf9ACef8'

const PAGE_ABI = new utils.Interface([
  'function registerContinuousMemoryPage(uint256 startAddr, uint256[] values, uint256 z, uint256 alpha, uint256 prime)',
])

/** @internal exported only for tests */
export const LOG_MEMORY_PAGE_FACT_CONTINUOUS = REGISTRY_ABI.getEventTopic(
  'LogMemoryPageFactContinuous'
)

export class PageCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly pageRepository: PageRepository
  ) {}

  async collect(blockRange: BlockRange): Promise<PageRecord[]> {
    const memoryPageEvents = await this.getMemoryPageEvents(blockRange)

    const records = await Promise.all(
      memoryPageEvents.map(
        async ({ memoryHash, transactionHash }): Promise<PageRecord> => {
          const tx = await this.ethereumClient.getTransaction(transactionHash)

          const decoded = PAGE_ABI.decodeFunctionData(
            'registerContinuousMemoryPage',
            tx.data
          )

          const data = (decoded[1] as BigNumber[])
            .map((x) => x.toHexString().substring(2).padStart(64, '0'))
            .join('')

          return {
            data,
            pageHash: memoryHash, // @todo is this correct?
            blockNumber: tx.blockNumber ?? blockRange.from,
          }
        }
      )
    )

    await this.pageRepository.add(records)
    return records
  }

  async discard({ from }: { from: BlockNumber }) {
    await this.pageRepository.deleteAllAfter(from - 1)
  }

  private async getMemoryPageEvents(
    blockRange: BlockRange
  ): Promise<MemoryPageEvent[]> {
    const logs = await this.ethereumClient.getLogs({
      address: REGISTRY_ADDRESS,
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [LOG_MEMORY_PAGE_FACT_CONTINUOUS],
    })

    return logs
      .map((log) => ({ log, event: REGISTRY_ABI.parseLog(log) }))
      .map(
        ({ log, event }): MemoryPageEvent => ({
          memoryHash: event.args.memoryHash.toHexString(),
          transactionHash: log.transactionHash,
        })
      )
  }
}

interface MemoryPageEvent {
  memoryHash: string
  transactionHash: string
}
