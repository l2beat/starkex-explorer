import { BigNumber, utils } from 'ethers'

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

export const PAGE_ABI = new utils.Interface([
  'function registerContinuousMemoryPage(uint256 startAddr, uint256[] values, uint256 z, uint256 alpha, uint256 prime)',
])

export class PageCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly pageRepository: PageRepository
  ) {}

  // @todo Needs tests
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

          const page = (decoded[1] as BigNumber[])
            .map((x) => x.toHexString().substring(2).padStart(64, '0'))
            .join('')

          return {
            page,
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
    await this.pageRepository.deleteAllAfter(from)
  }

  private async getMemoryPageEvents(
    blockRange: BlockRange
  ): Promise<MemoryPageEvent[]> {
    const res: MemoryPageEvent[] = []

    const logs = await this.ethereumClient.getLogs({
      address: REGISTRY_ADDRESS,
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [REGISTRY_ABI.getEventTopic('LogMemoryPageFactContinuous')],
    })

    const events = logs
      .map((log) => ({ log, event: REGISTRY_ABI.parseLog(log) }))
      .map(
        ({ log, event }): MemoryPageEvent => ({
          memoryHash: event.args.memoryHash.toHexString(),
          transactionHash: log.transactionHash,
        })
      )

    res.push(...events)

    return res
  }
}

interface MemoryPageEvent {
  memoryHash: string
  transactionHash: string
}
