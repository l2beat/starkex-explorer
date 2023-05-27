import { decodeOnChainData } from '@explorer/encoding'

import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'
import { PageCollector } from './collectors/PageCollector'
import { PageMappingCollector } from './collectors/PageMappingCollector'
import { PerpetualRollupStateTransitionCollector } from './collectors/PerpetualRollupStateTransitionCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { UserTransactionCollector } from './collectors/UserTransactionCollector'
import { VerifierCollector } from './collectors/VerifierCollector'
import { WithdrawalAllowedCollector } from './collectors/WithdrawalAllowedCollector'
import { IDataSyncService } from './IDataSyncService'
import {
  PerpetualRollupStateTransition,
  PerpetualRollupUpdater,
} from './PerpetualRollupUpdater'

export class PerpetualRollupSyncService implements IDataSyncService {
  constructor(
    private readonly verifierCollector: VerifierCollector,
    private readonly pageMappingCollector: PageMappingCollector,
    private readonly pageCollector: PageCollector,
    private readonly perpetualRollupStateTransitionCollector: PerpetualRollupStateTransitionCollector,
    private readonly perpetualRollupUpdater: PerpetualRollupUpdater,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly userTransactionCollector: UserTransactionCollector,
    private readonly withdrawalAllowedCollector: WithdrawalAllowedCollector,
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

    await this.userTransactionCollector.collect(blockRange)
    await this.withdrawalAllowedCollector.collect(blockRange)

    this.logger.info({
      method: 'sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      verifiers: verifiers.length,
      pages: pages.length,
      pageMappings: pageMappings.length,
      stateTransitions: stateTransitionRecords.length,
      userRegistrations: userRegistrations.length,
    })

    await this.processStateUpdates(stateTransitionRecords)
  }

  async processStateUpdates(
    stateTransitions: PerpetualRollupStateTransition[]
  ): Promise<void> {
    const recordsWithPages =
      await this.perpetualRollupUpdater.loadRequiredPages(stateTransitions)

    for (const record of recordsWithPages) {
      const onChainData = decodeOnChainData(record.pages)
      await this.perpetualRollupUpdater.processOnChainStateTransition(
        {
          id: record.id,
          blockNumber: record.blockNumber,
          stateTransitionHash: record.stateTransitionHash,
        },
        record.batchId,
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
    await this.userTransactionCollector.discardAfter(blockNumber)
    await this.withdrawalAllowedCollector.discardAfter(blockNumber)
  }
}
