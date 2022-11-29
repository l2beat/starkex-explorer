import { decodeOnChainData } from '@explorer/encoding'

import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'
import { FinalizeExitEventsCollector } from './collectors/FinalizeExitEventsCollector'
import { ForcedEventsCollector } from './collectors/ForcedEventsCollector'
import { PageCollector } from './collectors/PageCollector'
import { PageMappingCollector } from './collectors/PageMappingCollector'
import { StateTransitionCollector } from './collectors/StateTransitionCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { VerifierCollector } from './collectors/VerifierCollector'
import { StateTransition, StateUpdater } from './StateUpdater'

export class DataSyncService {
  constructor(
    private readonly verifierCollector: VerifierCollector,
    private readonly pageMappingCollector: PageMappingCollector,
    private readonly pageCollector: PageCollector,
    private readonly stateTransitionCollector: StateTransitionCollector,
    private readonly stateUpdater: StateUpdater,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly forcedEventsCollector: ForcedEventsCollector,
    private readonly finalizeExitEventsCollector: FinalizeExitEventsCollector,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async sync(blockRange: BlockRange) {
    const verifiers = await this.verifierCollector.collect(blockRange)

    const pages = await this.pageCollector.collect(blockRange)
    const pageMappings = await this.pageMappingCollector.collect(
      blockRange,
      verifiers
    )
    const stateTransitionRecords = await this.stateTransitionCollector.collect(
      blockRange
    )

    const userRegistrations = await this.userRegistrationCollector.collect(
      blockRange
    )
    const forcedEvents = await this.forcedEventsCollector.collect(blockRange)
    const finalizeExitEvents = await this.finalizeExitEventsCollector.collect(
      blockRange
    )

    this.logger.info({
      method: 'sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      verifiers: verifiers.length,
      pages: pages.length,
      pageMappings: pageMappings.length,
      stateTransitions: stateTransitionRecords.length,
      userRegistrations: userRegistrations.length,
      forcedEvents,
      finalizeExitEvents,
    })

    const recordsWithPages = await this.stateUpdater.loadRequiredPages(
      stateTransitionRecords
    )
    const stateTransitions: StateTransition[] = recordsWithPages.map((r) => {
      const onChainData = decodeOnChainData(r.pages)
      return {
        stateTransitionRecord: {
          id: r.id,
          blockNumber: r.blockNumber,
          stateTransitionHash: r.stateTransitionHash,
        },
        onChainData,
      }
    })

    for (const stateTransition of stateTransitions) {
      await this.stateUpdater.processOnChainStateTransition(stateTransition)
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.verifierCollector.discardAfter(blockNumber)
    await this.pageMappingCollector.discardAfter(blockNumber)
    await this.pageCollector.discardAfter(blockNumber)
    await this.stateTransitionCollector.discardAfter(blockNumber)
    await this.stateUpdater.discardAfter(blockNumber)
    await this.userRegistrationCollector.discardAfter(blockNumber)
  }
}
