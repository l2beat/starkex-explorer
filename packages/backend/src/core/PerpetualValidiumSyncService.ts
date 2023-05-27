import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { TransactionDownloader } from '../peripherals/starkware/TransactionDownloader'
import { Logger } from '../tools/Logger'
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
    private readonly transactionDownloader: TransactionDownloader | undefined,
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

    await this.processStateUpdates(stateTransitions)

    const lastStateTransition = stateTransitions[stateTransitions.length - 1]
    if (!lastStateTransition) return
    await this.transactionDownloader?.sync(lastStateTransition.sequenceNumber)
  }

  async processStateUpdates(
    stateTransitions: ValidiumStateTransition[]
  ): Promise<void> {
    for (const transition of stateTransitions) {
      const [perpetualCairoOutput, batch] = await Promise.all([
        this.perpetualCairoOutputCollector.collect(transition.transactionHash),
        this.availabilityGatewayClient.getPerpetualBatchData(
          transition.batchId
        ),
      ])
      if (!batch) {
        throw new Error(`Unable to download batch ${transition.batchId}`)
      }
      await this.perpetualValidiumUpdater.processValidiumStateTransition(
        transition,
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
    await this.transactionDownloader?.discardAfter(blockNumber)
  }
}
