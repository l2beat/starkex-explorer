import { utils } from 'ethers'

import { EthereumAddress } from '../model'
import { FactToPageRepository } from '../peripherals/database/FactToPageRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber, BlockRange } from '../peripherals/ethereum/types'

const GPS_VERIFIER_ABI = new utils.Interface([
  'event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes)',
])

export const PAGE_ABI = new utils.Interface([
  'function registerContinuousMemoryPage(uint256 startAddr, uint256[] values, uint256 z, uint256 alpha, uint256 prime)',
])

export class MemoryHashEventCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly factToPageRepository: FactToPageRepository
  ) {}

  // @todo needs tests
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
            event.pagesHashes.map((pageHash) => ({
              pageHash,
              factHash: event.factHash,
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
    await this.factToPageRepository.deleteAllAfter(from)
  }

  private async getMemoryHashEvents(
    blockRange: BlockRange,
    verifierAddress: EthereumAddress
  ): Promise<MemoryHashEvent[]> {
    const res: MemoryHashEvent[] = []

    const logs = await this.ethereumClient.getLogs({
      address: verifierAddress.toString(),
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [GPS_VERIFIER_ABI.getEventTopic('LogMemoryPagesHashes')],
    })

    const events = logs.map((log): MemoryHashEvent => {
      const event = GPS_VERIFIER_ABI.parseLog(log)

      return {
        blockNumber: log.blockNumber,
        factHash: event.args.factHash,
        pagesHashes: event.args.pagesHashes,
      }
    })

    res.push(...events)

    return res
  }
}

interface MemoryHashEvent {
  factHash: string
  pagesHashes: string[]
  blockNumber: BlockNumber
}
