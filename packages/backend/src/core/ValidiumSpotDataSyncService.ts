import { decodeFirstPage, StarkExProgramOutput } from '@explorer/encoding'
import { Position } from '@explorer/state'
import { EthereumAddress, Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { BlockRange } from '../model'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { PerpetualBatch } from '../peripherals/starkware/toPerpetualBatch'
import { Logger } from '../tools/Logger'
import { LogRootUpdate, LogStateTransitionFact } from './collectors/events'
import { FinalizeExitEventsCollector } from './collectors/FinalizeExitEventsCollector'
import { ForcedEventsCollector } from './collectors/ForcedEventsCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { StateUpdater } from './StateUpdater'

interface ValidiumStateTransition {
  blockNumber: number
  transactionHash: Hash256
  stateTransitionFact: Hash256
  sequenceNumber: number
  batchId: number
}

export class ValidiumSpotDataSyncService {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly availabilityGatewayClient: AvailabilityGatewayClient,
    private readonly perpetual: EthereumAddress,
    private readonly stateUpdater: StateUpdater,
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

    await this.processValidiumStateTransitions(stateTransitions)
  }

  private async processValidiumStateTransitions(
    validiumStateTransition: ValidiumStateTransition[]
  ) {
    const { oldHash, id } = await this.stateUpdater.readLastUpdate()
    await this.stateUpdater.ensureRollupState(oldHash)

    for (const [i, transition] of validiumStateTransition.entries()) {
      const programOutput = await this.getProgramOutput(
        transition.transactionHash
      )
      const batch = await this.availabilityGatewayClient.getPerpetualBatch(
        transition.batchId
      )
      const newPositions = this.buildNewPositions(batch)

      await this.stateUpdater.processStateTransition(
        {
          id: id + i + 1,
          blockNumber: transition.blockNumber,
          stateTransitionHash: transition.stateTransitionFact,
        },
        programOutput,
        newPositions
      )
    }
  }

  private async collectValidiumStateTransitions(
    blockRange: BlockRange
  ): Promise<ValidiumStateTransition[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetual.toString(),
      topics: [[LogStateTransitionFact.topic, LogRootUpdate.topic]],
    })

    const parsed = logs.map((log) => ({
      ...log,
      ...(LogStateTransitionFact.safeParseLog(log) ??
        LogRootUpdate.parseLog(log)),
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
        updateState?.name !== 'LogRootUpdate' ||
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

  buildNewPositions(
    batch: PerpetualBatch | undefined
  ): { index: bigint; value: Position }[] {
    if (!batch) {
      return []
    }
    return batch.positions.map((position) => ({
      index: position.positionId,
      value: new Position(
        position.starkKey,
        position.collateralBalance,
        position.assets
      ),
    }))
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
    await this.stateUpdater.discardAfter(blockNumber)
    await this.userRegistrationCollector.discardAfter(blockNumber)
  }
}
