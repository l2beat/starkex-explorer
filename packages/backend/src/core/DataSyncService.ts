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
  }

  // Temporary
  async getDecodedPages() {
    // blockRange?
    const pages = await this.pageRepository.getAllForFacts()
  }

  async revert(blockNumber: BlockNumber) {
    await this.verifierCollector.discard({ from: blockNumber })
    await this.memoryHashEventCollector.discard({ from: blockNumber })
    await this.pageCollector.discard({ from: blockNumber })
  }
}
