import { decodeOnChainData } from '@explorer/encoding'

import { BlockRange } from '../model'
import { PageRepository } from '../peripherals/database/PageRepository'
import { PositionUpdateRepository } from '../peripherals/database/PositionUpdateRepository'
import { BlockNumber } from '../peripherals/ethereum/types'
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
    private readonly pageRepository: PageRepository,
    private readonly positionUpdateRepository: PositionUpdateRepository,
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
      blockRange: { from: blockRange.start, to: blockRange.end },
      newVerifiers: verifiers.map(String),
      newHashEventsCount: hashEvents.length,
      newPageRecords: pageRecords.length,
      newStateTransitionFacts: stateTransitionFacts.length,
    })

    const stateTransitions = await this.pageRepository.getAllForFacts(
      stateTransitionFacts.map((f) => f.hash)
    )

    for (const { pages } of stateTransitions) {
      const decoded = decodeOnChainData(pages)

      await this.positionUpdateRepository.addOrUpdate(
        decoded.positions.map((positionUpdate) => {
          return {
            stateUpdateId: Number(decoded.newState.systemTime), // @todo
            ...positionUpdate,
          }
        })
      )
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.verifierCollector.discardAfter(blockNumber)
    await this.memoryHashEventCollector.discardAfter(blockNumber)
    await this.pageCollector.discardAfter(blockNumber)
    await this.stateTransitionFactCollector.discardAfter(blockNumber)
  }
}
