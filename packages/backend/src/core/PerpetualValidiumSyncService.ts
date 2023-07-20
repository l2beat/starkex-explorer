import { Logger } from '@l2beat/backend-tools'

import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { FeederGatewayCollector } from './collectors/FeederGatewayCollector'
import { PerpetualCairoOutputCollector } from './collectors/PerpetualCairoOutputCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { UserTransactionCollector } from './collectors/UserTransactionCollector'
import { PerpetualValidiumStateTransitionCollector } from './collectors/ValidiumStateTransitionCollector'
import { WithdrawalAllowedCollector } from './collectors/WithdrawalAllowedCollector'
import { IDataSyncService } from './IDataSyncService'
import {
  PerpetualValidiumUpdater,
  ValidiumStateTransition,
} from './PerpetualValidiumUpdater'
import { LiveL2TransactionDownloader } from './sync/LiveL2TransactionDownloader'

export class PerpetualValidiumSyncService implements IDataSyncService {
  constructor(
    private readonly availabilityGatewayClient: AvailabilityGatewayClient,
    private readonly perpetualValidiumStateTransitionCollector: PerpetualValidiumStateTransitionCollector,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly userTransactionCollector: UserTransactionCollector,
    private readonly perpetualCairoOutputCollector: PerpetualCairoOutputCollector,
    private readonly perpetualValidiumUpdater: PerpetualValidiumUpdater,
    private readonly withdrawalAllowedCollector: WithdrawalAllowedCollector,
    private readonly feederGatewayCollector: FeederGatewayCollector | undefined,
    private readonly L2TransactionDownloader:
      | LiveL2TransactionDownloader
      | undefined,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async sync(blockRange: BlockRange, isTip: boolean) {
    const userRegistrations = await this.userRegistrationCollector.collect(
      blockRange
    )

    await this.userTransactionCollector.collect(blockRange)
    await this.withdrawalAllowedCollector.collect(blockRange)

    const stateTransitions =
      await this.perpetualValidiumStateTransitionCollector.collect(blockRange)

    this.logger.info({
      method: 'perpetual validium sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      stateTransitions: stateTransitions.length,
      userRegistrations: userRegistrations.length,
    })

    await this.processStateTransitions(stateTransitions)
    await this.feederGatewayCollector?.collect()

    if (isTip) {
      await this.L2TransactionDownloader?.enableSync()
    }
  }

  async processStateTransitions(stateTransitions: ValidiumStateTransition[]) {
    for (const stateTransition of stateTransitions) {
      const [perpetualCairoOutput, batch] = await Promise.all([
        this.perpetualCairoOutputCollector.collect(
          stateTransition.transactionHash,
          stateTransition.blockNumber
        ),
        this.availabilityGatewayClient.getPerpetualBatchData(
          stateTransition.batchId
        ),
      ])
      if (!batch) {
        throw new Error(`Unable to download batch ${stateTransition.batchId}`)
      }
      await this.perpetualValidiumUpdater.processValidiumStateTransition(
        stateTransition,
        perpetualCairoOutput,
        batch
      )
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.perpetualValidiumStateTransitionCollector.discardAfter(
      blockNumber
    )
    await this.perpetualValidiumUpdater.discardAfter(blockNumber)
    await this.userRegistrationCollector.discardAfter(blockNumber)
    await this.userTransactionCollector.discardAfter(blockNumber)
    await this.withdrawalAllowedCollector.discardAfter(blockNumber)
    await this.feederGatewayCollector?.discardAfter(blockNumber)
  }
}
