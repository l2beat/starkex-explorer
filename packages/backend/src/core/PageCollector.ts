import assert from 'assert'
import { BigNumber, utils } from 'ethers'

import { BlockRange, Hash256 } from '../model'
import {
  PageRecord,
  PageRepository,
} from '../peripherals/database/PageRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'

const REGISTRY_ABI = new utils.Interface([
  'event LogMemoryPageFactContinuous(bytes32 factHash, uint256 memoryHash, uint256 prod)',
])

const REGISTRY_ADDRESS = '0xEfbCcE4659db72eC6897F46783303708cf9ACef8'

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

          const values = decoded[1] as BigNumber[]
          const data = values.map(bignumToPaddedString).join('')

          return {
            data,
            pageHash: memoryHash,
            blockNumber: tx.blockNumber ?? blockRange.from,
          }
        }
      )
    )

    await this.pageRepository.add(records)
    return records
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.pageRepository.deleteAllAfter(lastToKeep)
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

    assert(blockRange.includes(logs), 'all logs must be from the block range')

    return logs
      .map((log) => ({ log, event: REGISTRY_ABI.parseLog(log) }))
      .map(({ log, event }): MemoryPageEvent => {
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
