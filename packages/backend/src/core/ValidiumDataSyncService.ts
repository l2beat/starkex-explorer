import {
  decodeFirstPage,
  OnChainPositionsUpdate,
  StarkExProgramOutput,
} from '@explorer/encoding'
import { EthereumAddress, Hash256 } from '@explorer/types'
import { BigNumber, utils } from 'ethers'

import { BlockRange } from '../model'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'
import { AvailabilityGatewayClient } from '../peripherals/starkware/AvailabilityGatewayClient'
import { PerpetualBatch } from '../peripherals/starkware/toPerpetualBatch'
import { Logger } from '../tools/Logger'
import { LogStateTransitionFact, LogUpdateState } from './collectors/events'
import { StateTransition, StateUpdater } from './StateUpdater'

export class ValidiumDataSyncService {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly availabilityGatewayClient: AvailabilityGatewayClient,
    private readonly perpetual: EthereumAddress,
    private readonly stateUpdater: StateUpdater,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async sync(blockRange: BlockRange) {
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

    const onChainTransitions: {
      blockNumber: number
      transactionHash: Hash256
      stateTransitionFact: Hash256
      sequenceNumber: number
      batchId: number
    }[] = []
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

      onChainTransitions.push({
        blockNumber: updateState.blockNumber,
        transactionHash: Hash256(updateState.transactionHash),
        stateTransitionFact: Hash256(
          stateTransitionFact.args.stateTransitionFact
        ),
        sequenceNumber: updateState.args.sequenceNumber.toNumber(),
        batchId: updateState.args.batchId.toNumber(),
      })
    }

    const stateTransitions: StateTransition[] = []

    const { oldHash, id } = await this.stateUpdater.readLastUpdate()
    await this.stateUpdater.ensureRollupState(oldHash)

    for (const [i, transition] of onChainTransitions.entries()) {
      const programOutput = await this.getProgramOutput(
        transition.transactionHash
      )
      const batch = await this.availabilityGatewayClient.getPerpetualBatch(
        transition.batchId
      )
      const positionUpdate = this.convertToPositionUpdates(programOutput, batch)

      const onChainData = { ...programOutput, ...positionUpdate }

      // TODO: overwrite due to error:
      // ERROR [SyncScheduler] Forced action included in state update does not have a matching mined transaction
      // on blockNumber: 7069174
      // state update id: 22
      onChainData.forcedActions = []

      stateTransitions.push({
        stateTransitionRecord: {
          id: id + i + 1,
          blockNumber: transition.blockNumber,
          stateTransitionHash: transition.stateTransitionFact,
        },
        onChainData,
      })
    }

    this.logger.info({
      method: 'validium sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      stateTransitions: stateTransitions.length,
    })

    for (const stateTransition of stateTransitions) {
      await this.stateUpdater.processStateTransition(stateTransition)
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.stateUpdater.discardAfter(blockNumber)
  }

  private convertToPositionUpdates(
    programOutput: StarkExProgramOutput,
    batch: PerpetualBatch | undefined
  ): OnChainPositionsUpdate {
    const fundingTimestamp = programOutput.newState.timestamp
    const result: OnChainPositionsUpdate = {
      funding: [
        {
          timestamp: fundingTimestamp,
          indices: programOutput.newState.indices,
        },
      ],
      positions: !batch
        ? []
        : batch.positions.map((position) => ({
            positionId: position.positionId,
            starkKey: position.starkKey,
            collateralBalance: position.collateralBalance,
            fundingTimestamp: fundingTimestamp,
            balances: position.assets.map((asset) => ({
              assetId: asset.assetId,
              balance: asset.balance,
            })),
          })),
    }
    return result
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
}
