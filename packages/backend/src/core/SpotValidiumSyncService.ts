import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { Logger } from '../tools/Logger'
import { AssetRegistrationCollector } from './collectors/AssetRegistrationCollector'
import { DepositWithTokenIdCollector } from './collectors/DepositWithTokenIdCollector'
import { SpotCairoOutputCollector } from './collectors/SpotCairoOutputCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { UserTransactionCollector } from './collectors/UserTransactionCollector'
import { SpotValidiumStateTransitionCollector } from './collectors/ValidiumStateTransitionCollector'
import { WithdrawalAllowedCollector } from './collectors/WithdrawalAllowedCollector'
import { IDataSyncService } from './IDataSyncService'
import {
  SpotValidiumUpdater,
  ValidiumStateTransition,
} from './SpotValidiumUpdater'

export class SpotValidiumSyncService implements IDataSyncService {
  constructor(
    private readonly availabilityGatewayClient: AvailabilityGatewayClient,
    private readonly spotValidiumStateTransitionCollector: SpotValidiumStateTransitionCollector,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly userTransactionCollector: UserTransactionCollector,
    private readonly spotCairoOutputCollector: SpotCairoOutputCollector,
    private readonly spotValidiumUpdater: SpotValidiumUpdater,
    private readonly assetRegistrationCollector: AssetRegistrationCollector,
    private readonly depositWithTokenIdCollector: DepositWithTokenIdCollector,
    private readonly withdrawalAllowedCollector: WithdrawalAllowedCollector,
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

    const assetRegistrations = await this.assetRegistrationCollector.collect(
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
      assetRegistrations,
      depositsWithTokenId: depositsWithTokenId.length,
    })

    await this.processStateTransitions(stateTransitions)
  }

  async processStateTransitions(stateTransitions: ValidiumStateTransition[]) {
    for (const stateTransition of stateTransitions) {
      const [spotCairoOutput, batch] = await Promise.all([
        this.spotCairoOutputCollector.collect(stateTransition.transactionHash),
        this.availabilityGatewayClient.getSpotBatchData(
          stateTransition.batchId
        ),
      ])
      if (!batch) {
        throw new Error(`Unable to download batch ${stateTransition.batchId}`)
      }
      await this.spotValidiumUpdater.processSpotValidiumStateTransition(
        stateTransition,
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
    await this.withdrawalAllowedCollector.discardAfter(blockNumber)
  }
}
