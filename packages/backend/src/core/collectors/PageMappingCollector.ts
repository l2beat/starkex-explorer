import { EthereumAddress, Hash256 } from '@explorer/types'

import { BlockRange } from '../../model'
import { FactToPageRepository } from '../../peripherals/database/FactToPageRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { EthereumEvent } from './EthereumEvent'

export interface PageMappingEvent {
  factHash: Hash256
  pageHashes: Hash256[]
  blockNumber: BlockNumber
}

export const LogMemoryPagesHashes = EthereumEvent<
  'LogMemoryPagesHashes',
  { factHash: string; pagesHashes: string[] }
>('event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes)')

export class PageMappingCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly factToPageRepository: FactToPageRepository
  ) {}

  async collect(
    blockRange: BlockRange,
    verifiers: EthereumAddress[]
  ): Promise<PageMappingEvent[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: verifiers.map((x) => x.toString()),
      topics: [LogMemoryPagesHashes.topic],
    })
    const events = logs.map((log): PageMappingEvent => {
      const event = LogMemoryPagesHashes.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        factHash: Hash256(event.args.factHash),
        pageHashes: event.args.pagesHashes.map(Hash256),
      }
    })

    await this.factToPageRepository.addMany(
      events.flatMap((event) =>
        event.pageHashes.map((pageHash, index) => ({
          index,
          pageHash,
          factHash: event.factHash,
          blockNumber: event.blockNumber,
        }))
      )
    )

    return events
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.factToPageRepository.deleteAllAfter(lastToKeep)
  }
}
