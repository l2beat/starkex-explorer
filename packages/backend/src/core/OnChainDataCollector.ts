import { decodeOnChainData } from '@explorer/encoding'

import { BlockRange } from '../model'
import { PageRepository } from '../peripherals/database/PageRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'
import { FinalizeExitEventsCollector } from './collectors/FinalizeExitEventsCollector'
import { ForcedEventsCollector } from './collectors/ForcedEventsCollector'
import { PageCollector } from './collectors/PageCollector'
import { PageMappingCollector } from './collectors/PageMappingCollector'
import { StateTransitionCollector } from './collectors/StateTransitionCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { VerifierCollector } from './collectors/VerifierCollector'
import { IDataCollector } from './DataCollector'
import { StateTransition, StateUpdater } from './StateUpdater'

export class OnChainDataCollector implements IDataCollector {
  constructor(
    private readonly verifierCollector: VerifierCollector,
    private readonly pageMappingCollector: PageMappingCollector,
    private readonly pageCollector: PageCollector,
    private readonly stateTransitionCollector: StateTransitionCollector,
    private readonly stateUpdater: StateUpdater,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly forcedEventsCollector: ForcedEventsCollector,
    private readonly finalizeExitEventsCollector: FinalizeExitEventsCollector,
    private readonly pageRepository: PageRepository,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async collect(blockRange: BlockRange): Promise<StateTransition[]> {
    const verifiers = await this.verifierCollector.collect(blockRange)

    const pages = await this.pageCollector.collect(blockRange)
    const pageMappings = await this.pageMappingCollector.collect(
      blockRange,
      verifiers
    )
    const stateTransitions = await this.stateTransitionCollector.collect(
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
      method: 'on-chain sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      verifiers: verifiers.length,
      pages: pages.length,
      pageMappings: pageMappings.length,
      stateTransitions: stateTransitions.length,
      userRegistrations: userRegistrations.length,
      forcedEvents,
      finalizeExitEvents,
    })

    return this.processStateTransitions(stateTransitions)
  }

  private async processStateTransitions(
    stateTransitions: Omit<StateTransitionRecord, 'id'>[]
  ): Promise<StateTransition[]> {
    if (stateTransitions.length === 0) {
      return []
    }

    const pageGroups = await this.pageRepository.getByStateTransitions(
      stateTransitions.map((x) => x.stateTransitionHash)
    )
    const stateTransitionsWithPages = pageGroups.map((pages, i) => {
      const stateTransition = stateTransitions[i]
      if (stateTransition === undefined) {
        throw new Error('Programmer error: state transition count mismatch')
      }
      return { ...stateTransition, pages }
    })
    if (pageGroups.length !== stateTransitions.length) {
      throw new Error('Missing pages for state transitions in database')
    }

    const { oldHash, id } = await this.stateUpdater.readLastUpdate()
    await this.stateUpdater.ensureRollupState(oldHash)

    const result: StateTransition[] = []
    for (const [i, stateTransition] of stateTransitionsWithPages.entries()) {
      const onChainData = decodeOnChainData(stateTransition.pages)
      result.push({
        stateTransitionRecord: {
          id: id + i + 1,
          blockNumber: stateTransition.blockNumber,
          stateTransitionHash: stateTransition.stateTransitionHash,
        },
        onChainData,
      })
    }

    return result
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
