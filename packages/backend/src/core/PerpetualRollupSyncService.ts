import { decodeOnChainData } from '@explorer/encoding'

import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'
import { FinalizeExitEventsCollector } from './collectors/FinalizeExitEventsCollector'
import { ForcedEventsCollector } from './collectors/ForcedEventsCollector'
import { PageCollector } from './collectors/PageCollector'
import { PageMappingCollector } from './collectors/PageMappingCollector'
import { PerpetualRollupStateTransitionCollector } from './collectors/PerpetualRollupStateTransitionCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { VerifierCollector } from './collectors/VerifierCollector'
import { IDataSyncService } from './IDataSyncService'
import { PerpetualRollupUpdater } from './PerpetualRollupUpdater'

export class PerpetualRollupSyncService implements IDataSyncService {
  constructor(
    private readonly verifierCollector: VerifierCollector,
    private readonly pageMappingCollector: PageMappingCollector,
    private readonly pageCollector: PageCollector,
    private readonly perpetualRollupStateTransitionCollector: PerpetualRollupStateTransitionCollector,
    private readonly perpetualRollupUpdater: PerpetualRollupUpdater,
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
    const stateTransitionRecords =
      await this.perpetualRollupStateTransitionCollector.collect(blockRange)

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

    const recordsWithPages =
      await this.perpetualRollupUpdater.loadRequiredPages(
        stateTransitionRecords
      )

    for (const record of recordsWithPages) {
      const onChainData = decodeOnChainData(record.pages)
      await this.perpetualRollupUpdater.processOnChainStateTransition(
        {
          id: record.id,
          blockNumber: record.blockNumber,
          stateTransitionHash: record.stateTransitionHash,
        },
        onChainData
      )
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.verifierCollector.discardAfter(blockNumber)
    await this.pageMappingCollector.discardAfter(blockNumber)
    await this.pageCollector.discardAfter(blockNumber)
    await this.perpetualRollupStateTransitionCollector.discardAfter(blockNumber)
    await this.perpetualRollupUpdater.discardAfter(blockNumber)
    await this.userRegistrationCollector.discardAfter(blockNumber)
  }
}
