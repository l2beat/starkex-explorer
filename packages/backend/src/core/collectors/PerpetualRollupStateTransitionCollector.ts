import { Hash256 } from '@explorer/types'
import { EthereumAddress } from '@explorer/types/src/EthereumAddress'

import { BlockRange } from '../../model/BlockRange'
import {
  StateTransitionRecord,
  StateTransitionRepository,
} from '../../peripherals/database/StateTransitionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { PerpetualRollupStateTransition } from '../PerpetualRollupUpdater'
import { LogStateTransitionFact, LogUpdateState } from './events'

export class PerpetualRollupStateTransitionCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly stateTransitionRepository: StateTransitionRepository,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async collect(
    blockRange: BlockRange
  ): Promise<PerpetualRollupStateTransition[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [LogStateTransitionFact.topic, LogUpdateState.topic],
    })

    const parsed = logs.map((log) => ({
      ...log,
      ...(LogStateTransitionFact.safeParseLog(log) ??
        LogUpdateState.parseLog(log)),
    }))

    if (parsed.length % 2 !== 0) {
      throw new Error('Some events have no pair')
    }

    const records: Omit<StateTransitionRecord, 'id'>[] = []
    const perpetualRollupStateTransitions: PerpetualRollupStateTransition[] = []
    for (let i = 0; i < parsed.length; i += 2) {
      const stateTransitionFact = parsed[i]
      const updateState = parsed[i + 1]
      if (stateTransitionFact?.name !== 'LogStateTransitionFact') {
        throw new Error('Unexpected state transition fact event')
      }
      if (updateState?.name !== 'LogUpdateState') {
        throw new Error('Unexpected state update event')
      }
      if (stateTransitionFact.transactionHash !== updateState.transactionHash) {
        throw new Error(
          'State transition fact and state update are not from the same transaction'
        )
      }
      perpetualRollupStateTransitions.push({
        batchId: updateState.args.batchId.toNumber(),
        blockNumber: stateTransitionFact.blockNumber,
        stateTransitionHash: Hash256(
          stateTransitionFact.args.stateTransitionFact
        ),
        transactionHash: Hash256(updateState.transactionHash),
        sequenceNumber: updateState.args.sequenceNumber.toNumber(),
      })
      records.push({
        blockNumber: stateTransitionFact.blockNumber,
        stateTransitionHash: Hash256(
          stateTransitionFact.args.stateTransitionFact
        ),
      })
    }

    await this.stateTransitionRepository.addMany(records)
    return perpetualRollupStateTransitions
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.stateTransitionRepository.deleteAfter(lastToKeep)
  }
}
