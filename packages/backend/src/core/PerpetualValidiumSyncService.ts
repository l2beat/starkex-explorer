import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { Logger } from '../tools/Logger'
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
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async sync(blockRange: BlockRange) {
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
  }

  async processStateTransitions(stateTransitions: ValidiumStateTransition[]) {
    let lastStateUpdateId: number | undefined

    for (const stateTransition of stateTransitions) {
      const [perpetualCairoOutput, batch] = await Promise.all([
        this.perpetualCairoOutputCollector.collect(
          stateTransition.transactionHash
        ),
        this.availabilityGatewayClient.getPerpetualBatchData(
          stateTransition.batchId
        ),
      ])
      if (!batch) {
        throw new Error(`Unable to download batch ${stateTransition.batchId}`)
      }
      const stateUpdate =
        await this.perpetualValidiumUpdater.processValidiumStateTransition(
          stateTransition,
          perpetualCairoOutput,
          batch
        )
      lastStateUpdateId = stateUpdate.id
    }

    if (lastStateUpdateId) {
      await this.feederGatewayCollector?.collect(lastStateUpdateId)
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
