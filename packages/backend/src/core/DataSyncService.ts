import { decodeOnChainData } from '@explorer/encoding'

import { PageRepository } from '../peripherals/database/PageRepository'
import { BlockNumber, BlockRange } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'
import { MemoryHashEventCollector } from './MemoryHashEventCollector'
import { PageCollector } from './PageCollector'
import { StateTransitionFactCollector } from './StateTransitionFactCollector'
import { VerifierCollector } from './VerifierCollector'

export class DataSyncService {
  constructor(
    private readonly verifierCollector: VerifierCollector,
    private readonly memoryHashEventCollector: MemoryHashEventCollector,
    private readonly pageCollector: PageCollector,
    private readonly stateTransitionFactCollector: StateTransitionFactCollector,
    // @todo where to move this?
    private readonly pageRepository: Pick<PageRepository, 'getAllForFacts'>,
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
    const stateTransitionFacts =
      await this.stateTransitionFactCollector.collect(blockRange)

    this.logger.info({
      method: 'sync',
      blockRange,
      newVerifiers: verifiers.map(String),
      newHashEventsCount: hashEvents.length,
      newPageRecords: pageRecords.length,
      newStateTransitionFacts: stateTransitionFacts.length,
    })

    const states = await this.pageRepository.getAllForFacts(
      stateTransitionFacts.map((f) => f.hash)
    )

    for (const state of states) {
      const decoded = decodeOnChainData(state.pages)
      console.log({
        hash: state.factHash,
        decoded,
      })
    }
    // const decodedPages = decodeUpdates(pages.map((p) => p.data).join(''))

    // console.log({ decodedPages })
  }

  async revert(blockNumber: BlockNumber) {
    await this.verifierCollector.discard({ from: blockNumber })
    await this.memoryHashEventCollector.discard({ from: blockNumber })
    await this.pageCollector.discard({ from: blockNumber })
  }
}
