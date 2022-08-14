import { EthereumAddress, Hash256 } from '@explorer/types'

import { BlockRange } from '../../model'
import { FactToPageRepository } from '../../peripherals/database/FactToPageRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { EthereumEvent } from './EthereumEvent'

export interface MemoryHashEvent {
  factHash: Hash256
  pagesHashes: Hash256[]
  blockNumber: BlockNumber
}

export const LogMemoryPagesHashes = EthereumEvent<
  'LogMemoryPagesHashes',
  { factHash: string; pagesHashes: string[] }
>('event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes)')

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
      verifierAddresses.map((verifierAddress) =>
        this.getMemoryHashEvents(blockRange, verifierAddress)
      )
    )
    const hashEvents = events.flat()

    await this.factToPageRepository.addMany(
      hashEvents.flatMap((event) =>
        event.pagesHashes.map((pageHash, index) => ({
          index,
          pageHash: pageHash,
          factHash: event.factHash,
          blockNumber: event.blockNumber,
        }))
      )
    )

    return hashEvents
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.factToPageRepository.deleteAllAfter(lastToKeep)
  }

  private async getMemoryHashEvents(
    blockRange: BlockRange,
    verifierAddress: EthereumAddress
  ): Promise<MemoryHashEvent[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: verifierAddress.toString(),
      topics: [LogMemoryPagesHashes.topic],
    })
    return logs.map((log): MemoryHashEvent => {
      const event = LogMemoryPagesHashes.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        factHash: Hash256(event.args.factHash),
        pagesHashes: event.args.pagesHashes.map(Hash256),
      }
    })
  }
}
