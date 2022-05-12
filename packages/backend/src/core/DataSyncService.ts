import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'
import { ForcedEventsCollector } from './ForcedEventsCollector'
import { MemoryHashEventCollector } from './MemoryHashEventCollector'
import { PageCollector } from './PageCollector'
import { StateTransitionFactCollector } from './StateTransitionFactCollector'
import { StateUpdateCollector } from './StateUpdateCollector'
import { UserRegistrationCollector } from './UserRegistrationCollector'
import { VerifierCollector } from './VerifierCollector'

export class DataSyncService {
  constructor(
    private readonly verifierCollector: VerifierCollector,
    private readonly memoryHashEventCollector: MemoryHashEventCollector,
    private readonly pageCollector: PageCollector,
    private readonly stateTransitionFactCollector: StateTransitionFactCollector,
    private readonly stateUpdateCollector: StateUpdateCollector,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly forcedEventsCollector: ForcedEventsCollector,
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
    const userRegistrationEvents = await this.userRegistrationCollector.collect(
      blockRange
    )
    const forcedEvents = await this.forcedEventsCollector.collect(blockRange)

    this.logger.info({
      method: 'sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      verifiers: verifiers.length,
      newHashEventsCount: hashEvents.length,
      newPageRecords: pageRecords.length,
      newStateTransitionFacts: stateTransitionFacts.length,
      userRegistrationEvents: userRegistrationEvents.length,
      forcedEvents,
    })

    await this.stateUpdateCollector.save(stateTransitionFacts)
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.verifierCollector.discardAfter(blockNumber)
    await this.memoryHashEventCollector.discardAfter(blockNumber)
    await this.pageCollector.discardAfter(blockNumber)
    await this.stateTransitionFactCollector.discardAfter(blockNumber)
    await this.stateUpdateCollector.discardAfter(blockNumber)
    await this.userRegistrationCollector.discardAfter(blockNumber)
  }
}
