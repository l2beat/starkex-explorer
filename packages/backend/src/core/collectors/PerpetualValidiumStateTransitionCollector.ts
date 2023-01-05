import { Hash256 } from '@explorer/types'
import { EthereumAddress } from '@explorer/types/src/EthereumAddress'

import { BlockRange } from '../../model/BlockRange'
import {
  StateTransitionRecord,
  StateTransitionRepository,
} from '../../peripherals/database/StateTransitionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { ValidiumStateTransition } from '../PerpetualValidiumUpdater'
import { LogStateTransitionFact, LogUpdateState } from './events'

export class PerpetualValidiumStateTransitionCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly stateTransitionRepository: StateTransitionRepository,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async collect(blockRange: BlockRange): Promise<ValidiumStateTransition[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
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
    const records: Omit<StateTransitionRecord, 'id'>[] = []
    for (let i = 0; i < parsed.length; i += 2) {
      const stateTransitionFact = parsed[i]
      const updateState = parsed[i + 1]
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
        stateTransitionHash: Hash256(
          stateTransitionFact.args.stateTransitionFact
        ),
        sequenceNumber: updateState.args.sequenceNumber.toNumber(),
        batchId: updateState.args.batchId.toNumber(),
      })
      records.push({
        blockNumber: updateState.blockNumber,
        stateTransitionHash: Hash256(
          stateTransitionFact.args.stateTransitionFact
        ),
      })
    }

    await this.stateTransitionRepository.addMany(records)
    return validiumStateTransitions
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.stateTransitionRepository.deleteAfter(lastToKeep)
  }
}
