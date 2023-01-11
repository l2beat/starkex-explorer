import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { Logger } from '../tools/Logger'
import { FinalizeExitEventsCollector } from './collectors/FinalizeExitEventsCollector'
import { ForcedEventsCollector } from './collectors/ForcedEventsCollector'
import { PerpetualCairoOutputCollector } from './collectors/PerpetualCairoOutputCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { PerpetualValidiumStateTransitionCollector } from './collectors/ValidiumStateTransitionCollector'
import { IDataSyncService } from './IDataSyncService'
import { PerpetualValidiumUpdater } from './PerpetualValidiumUpdater'

export class PerpetualValidiumSyncService implements IDataSyncService {
  constructor(
    private readonly availabilityGatewayClient: AvailabilityGatewayClient,
    private readonly perpetualValidiumStateTransitionCollector: PerpetualValidiumStateTransitionCollector,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly forcedEventsCollector: ForcedEventsCollector,
    private readonly finalizeExitEventsCollector: FinalizeExitEventsCollector,
    private readonly perpetualCairoOutputCollector: PerpetualCairoOutputCollector,
    private readonly perpetualValidiumUpdater: PerpetualValidiumUpdater,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async sync(blockRange: BlockRange) {
    const userRegistrations = await this.userRegistrationCollector.collect(
      blockRange
    )
    const forcedEvents = await this.forcedEventsCollector.collect(blockRange)

    const finalizeExitEvents = await this.finalizeExitEventsCollector.collect(
      blockRange
    )

    const stateTransitions =
      await this.perpetualValidiumStateTransitionCollector.collect(blockRange)

    this.logger.info({
      method: 'perpetual validium sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      stateTransitions: stateTransitions.length,
      userRegistrations: userRegistrations.length,
      forcedEvents,
      finalizeExitEvents,
    })

    for (const transition of stateTransitions) {
      const [perpetualCairoOutput, batch] = await Promise.all([
        this.perpetualCairoOutputCollector.collect(transition.transactionHash),
        this.availabilityGatewayClient.getPerpetualBatch(transition.batchId),
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
  }
}
