import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { Logger } from '../tools/Logger'
import { DepositWithTokenIdCollector } from './collectors/DepositWithTokenIdCollector'
import { SpotCairoOutputCollector } from './collectors/SpotCairoOutputCollector'
import { TokenRegistrationCollector } from './collectors/TokenRegistrationCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { UserTransactionCollector } from './collectors/UserTransactionCollector'
import { SpotValidiumStateTransitionCollector } from './collectors/ValidiumStateTransitionCollector'
import { IDataSyncService } from './IDataSyncService'
import { SpotValidiumUpdater } from './SpotValidiumUpdater'

export class SpotValidiumSyncService implements IDataSyncService {
  constructor(
    private readonly availabilityGatewayClient: AvailabilityGatewayClient,
    private readonly spotValidiumStateTransitionCollector: SpotValidiumStateTransitionCollector,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly userTransactionCollector: UserTransactionCollector,
    private readonly spotCairoOutputCollector: SpotCairoOutputCollector,
    private readonly spotValidiumUpdater: SpotValidiumUpdater,
    private readonly tokenRegistrationCollector: TokenRegistrationCollector,
    private readonly depositWithTokenIdCollector: DepositWithTokenIdCollector,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async sync(blockRange: BlockRange) {
    const userRegistrations = await this.userRegistrationCollector.collect(
      blockRange
    )
    // TODO: fix forced events
    // await this.userTransactionCollector.collect(blockRange)

    const tokenRegistrations = await this.tokenRegistrationCollector.collect(
      blockRange
    )
    const depositsWithTokenId = await this.depositWithTokenIdCollector.collect(
      blockRange
    )

    const stateTransitions =
      await this.spotValidiumStateTransitionCollector.collect(blockRange)

    this.logger.info({
      method: 'spot validium sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      stateTransitions: stateTransitions.length,
      userRegistrations: userRegistrations.length,
      tokenRegistrations: tokenRegistrations.length,
      depositsWithTokenId: depositsWithTokenId.length,
    })

    for (const transition of stateTransitions) {
      const [spotCairoOutput, batch] = await Promise.all([
        this.spotCairoOutputCollector.collect(transition.transactionHash),
        this.availabilityGatewayClient.getSpotBatch(transition.batchId),
      ])
      if (!batch) {
        throw new Error(`Unable to download batch ${transition.batchId}`)
      }
      await this.spotValidiumUpdater.processSpotValidiumStateTransition(
        transition,
        spotCairoOutput,
        batch
      )
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.spotValidiumStateTransitionCollector.discardAfter(blockNumber)
    await this.spotValidiumUpdater.discardAfter(blockNumber)
    await this.userRegistrationCollector.discardAfter(blockNumber)
    await this.userTransactionCollector.discardAfter(blockNumber)
  }
}
