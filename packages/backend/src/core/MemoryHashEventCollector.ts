import { utils } from 'ethers'

import { EthereumAddress, Hash256 } from '../model'
import { FactToPageRepository } from '../peripherals/database/FactToPageRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber, BlockRange } from '../peripherals/ethereum/types'

const GPS_VERIFIER_ABI = new utils.Interface([
  'event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes)',
])

/** @internal exported only for tests */
export const LOG_MEMORY_PAGE_HASHES = GPS_VERIFIER_ABI.getEventTopic(
  'LogMemoryPagesHashes'
)

export class MemoryHashEventCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly factToPageRepository: FactToPageRepository
  ) {}

  async collect(
    blockRange: BlockRange,
    verifierAddresses: EthereumAddress[]
  ): Promise<MemoryHashEvent[]> {
    const events = await Promise.all(
      verifierAddresses.map(async (verifierAddress) => {
        const hashEvents = await this.getMemoryHashEvents(
          blockRange,
          verifierAddress
        )

        await this.factToPageRepository.add(
          hashEvents.flatMap((event) =>
            event.pagesHashes.map((pageHash, index) => ({
              index,
              pageHash: Hash256(pageHash),
              factHash: Hash256(event.factHash),
              blockNumber: event.blockNumber,
            }))
          )
        )

        return hashEvents
      })
    )

    return events.flat(1)
  }

  async discard({ from }: { from: BlockNumber }) {
    await this.factToPageRepository.deleteAllAfter(from - 1)
  }

  private async getMemoryHashEvents(
    blockRange: BlockRange,
    verifierAddress: EthereumAddress
  ): Promise<MemoryHashEvent[]> {
    const logs = await this.ethereumClient.getLogs({
      address: verifierAddress.toString(),
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [LOG_MEMORY_PAGE_HASHES],
    })

    return logs.map((log): MemoryHashEvent => {
      const event = GPS_VERIFIER_ABI.parseLog(log)

      return {
        blockNumber: log.blockNumber,
        factHash: event.args.factHash,
        pagesHashes: event.args.pagesHashes,
      }
    })
  }
}

interface MemoryHashEvent {
  factHash: Hash256
  pagesHashes: string[]
  blockNumber: BlockNumber
}
