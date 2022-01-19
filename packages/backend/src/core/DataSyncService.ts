import { decodeOnChainData } from '@explorer/encoding'
import { PageRepository } from '../peripherals/database/PageRepository'
import { BlockNumber, BlockRange } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'
import { MemoryHashEventCollector } from './MemoryHashEventCollector'
import { PageCollector } from './PageCollector'
import { VerifierCollector } from './VerifierCollector'

export class DataSyncService {
  constructor(
    private readonly verifierCollector: VerifierCollector,
    private readonly memoryHashEventCollector: MemoryHashEventCollector,
    private readonly pageCollector: PageCollector,
    private readonly pageRepository: PageRepository,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async sync(blockRange: BlockRange) {
    const verifiers = await this.verifierCollector.collect(blockRange)
    const hashEvents = await this.memoryHashEventCollector.collect(
      blockRange,
      verifiers
    )
    const pageRecords = await this.pageCollector.collect(blockRange)

    this.logger.info({
      method: 'sync',
      blockRange,
      newVerifiers: verifiers.map(String),
      newHashEventsCount: hashEvents.length,
      newPageRecords: pageRecords.length,
    })

    // dla faktów w tym block range (LogStateTransitionFact)
    //
    // const pageHashesInOrder = facts
    // .flatMap(
    //   (fact) =>
    //     memoryHashEvents.find((x) => x.factHash === fact)?.pagesHashes ?? []
    // )
    //
    // zapisz fakty
    // docelowo wywołać funkcję zmiany stanu
  }

  // Temporary
  async getOnChainData() {
    // blockRange?
    const pages = await this.pageRepository.getAllForFacts([])

    return decodeOnChainData(pages.map((p) => p.page))
  }

  async revert(blockNumber: BlockNumber) {
    await this.verifierCollector.discard({ from: blockNumber })
    await this.memoryHashEventCollector.discard({ from: blockNumber })
    await this.pageCollector.discard({ from: blockNumber })
  }
}
