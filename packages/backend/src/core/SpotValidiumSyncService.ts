import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { Logger } from '../tools/Logger'
import { DexOutputCollector } from './collectors/DexOutputCollector'
import { FinalizeExitEventsCollector } from './collectors/FinalizeExitEventsCollector'
import { ForcedEventsCollector } from './collectors/ForcedEventsCollector'
import { SpotValidiumStateTransitionCollector } from './collectors/SpotValidiumStateTransitionCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { PerpetualValidiumUpdater } from './PerpetualValidiumUpdater'

export class SpotValidiumSyncService {
  constructor(
    private readonly availabilityGatewayClient: AvailabilityGatewayClient,
    private readonly stateTransitionCollector: SpotValidiumStateTransitionCollector,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly forcedEventsCollector: ForcedEventsCollector,
    private readonly finalizeExitEventsCollector: FinalizeExitEventsCollector,
    private readonly dexOutputCollector: DexOutputCollector,
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

    const stateTransitions = await this.stateTransitionCollector.collect(
      blockRange
    )

    this.logger.info({
      method: 'validium sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      stateTransitions: stateTransitions.length,
      userRegistrations: userRegistrations.length,
      forcedEvents,
      finalizeExitEvents,
    })

    for (const transition of stateTransitions) {
      const [dexOutput, batch] = await Promise.all([
        this.dexOutputCollector.collect(transition.transactionHash),
        this.availabilityGatewayClient.getSpotBatch(transition.batchId),
      ])
      if (!batch) {
        throw new Error(`Unable to download batch ${transition.batchId}`)
      }
      await this.perpetualValidiumUpdater.processValidiumStateTransition(
        transition,
        dexOutput,
        batch
      )
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.stateTransitionCollector.discardAfter(blockNumber)
    await this.perpetualValidiumUpdater.discardAfter(blockNumber)
    await this.userRegistrationCollector.discardAfter(blockNumber)
  }
}
