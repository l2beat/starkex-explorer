import { decodeFirstPage, StarkExProgramOutput } from '@explorer/encoding'
import { EthereumAddress, Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { BlockRange } from '../model'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { Logger } from '../tools/Logger'
import { LogStateTransitionFact, LogUpdateState } from './collectors/events'
import { FinalizeExitEventsCollector } from './collectors/FinalizeExitEventsCollector'
import { ForcedEventsCollector } from './collectors/ForcedEventsCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import {
  PerpetualValidiumUpdater,
  ValidiumStateTransition,
} from './PerpetualValidiumUpdater'

export class PerpetualValidiumSyncService {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly availabilityGatewayClient: AvailabilityGatewayClient,
    private readonly perpetual: EthereumAddress,
    private readonly perpetualValidiumUpdater: PerpetualValidiumUpdater,
    private readonly userRegistrationCollector: UserRegistrationCollector,
    private readonly forcedEventsCollector: ForcedEventsCollector,
    private readonly finalizeExitEventsCollector: FinalizeExitEventsCollector,
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

    const stateTransitions = await this.collectValidiumStateTransitions(
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
      const [programOutput, batch] = await Promise.all([
        this.getProgramOutput(transition.transactionHash),
        this.availabilityGatewayClient.getPerpetualBatch(transition.batchId),
      ])
      if (!batch) {
        throw new Error(`Unable to download batch ${transition.batchId}`)
      }
      await this.perpetualValidiumUpdater.processValidiumStateTransition(
        transition,
        programOutput,
        batch
      )
    }
  }

  private async collectValidiumStateTransitions(
    blockRange: BlockRange
  ): Promise<ValidiumStateTransition[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetual.toString(),
      topics: [[LogStateTransitionFact.topic, LogUpdateState.topic]],
    })

    const parsed = logs.map((log) => ({
      ...log,
      ...(LogStateTransitionFact.safeParseLog(log) ??
        LogUpdateState.parseLog(log)),
    }))

    if (parsed.length % 2 !== 0) {
      throw new Error('Some events have no pair')
    }

    const validiumStateTransitions = []
    for (let i = 0; i < parsed.length / 2; i++) {
      const stateTransitionFact = parsed[i * 2]
      const updateState = parsed[i * 2 + 1]
      if (
        stateTransitionFact?.name !== 'LogStateTransitionFact' ||
        updateState?.name !== 'LogUpdateState' ||
        stateTransitionFact.transactionHash !== updateState.transactionHash
      ) {
        throw new Error('Invalid event order')
      }

      validiumStateTransitions.push({
        blockNumber: updateState.blockNumber,
        transactionHash: Hash256(updateState.transactionHash),
        stateTransitionFact: Hash256(
          stateTransitionFact.args.stateTransitionFact
        ),
        sequenceNumber: updateState.args.sequenceNumber.toNumber(),
        batchId: updateState.args.batchId.toNumber(),
      })
    }
    return validiumStateTransitions
  }

  private async getProgramOutput(
    transactionHash: Hash256
  ): Promise<StarkExProgramOutput> {
    const tx = await this.ethereumClient.getTransaction(transactionHash)
    if (!tx) {
      throw new Error('Invalid transaction')
    }
    const abi = new utils.Interface([
      'function updateState(uint256[] calldata programOutput, uint256[] calldata applicationData)',
    ])
    const decoded = abi.decodeFunctionData('updateState', tx.data)
    const programOutputValues = decoded.programOutput as BigNumber[]
    const hexData = programOutputValues
      .map((x) => x.toHexString().slice(2).padStart(64, '0'))
      .join('')
    return decodeFirstPage(hexData)
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.perpetualValidiumUpdater.discardAfter(blockNumber)
    await this.userRegistrationCollector.discardAfter(blockNumber)
  }
}
