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
import { LogRootUpdate, LogStateTransitionFact, LogUpdateState } from './events'

type StateUpdateEvent = typeof LogRootUpdate | typeof LogUpdateState

export class ValidiumStateTransitionCollector<T extends StateUpdateEvent> {
  constructor(
    protected readonly ethereumClient: EthereumClient,
    protected readonly stateTransitionRepository: StateTransitionRepository,
    protected readonly starkExAddress: EthereumAddress,
    protected readonly stateUpdateEvent: T
  ) {}

  async collect(blockRange: BlockRange): Promise<ValidiumStateTransition[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.starkExAddress.toString(),
      topics: [[LogStateTransitionFact.topic, this.stateUpdateEvent.topic]],
    })

    const parsed = logs.map((log) => ({
      ...log,
      ...(LogStateTransitionFact.safeParseLog(log) ??
        this.stateUpdateEvent.parseLog(log)),
    }))

    if (parsed.length % 2 !== 0) {
      throw new Error('Some events have no pair')
    }

    const validiumStateTransitions = []
    const records: Omit<StateTransitionRecord, 'id'>[] = []
    for (let i = 0; i < parsed.length; i += 2) {
      const stateTransitionFact = parsed[i]
      const updateState = parsed[i + 1]
      if (stateTransitionFact?.name !== 'LogStateTransitionFact') {
        throw new Error('Unexpected state transition fact event')
      }
      if (
        // Typescript doesn't allow to use this.stateUpdateEvent.name here
        updateState?.name !== 'LogRootUpdate' &&
        updateState?.name !== 'LogUpdateState'
      ) {
        throw new Error('Unexpected state update event')
      }
      if (stateTransitionFact.transactionHash !== updateState.transactionHash) {
        throw new Error(
          'State transition fact and state update are not from the same transaction'
        )
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

type ConstructorArgs = ConstructorParameters<
  typeof ValidiumStateTransitionCollector
> extends [...infer T, unknown]
  ? T
  : never

export class SpotValidiumStateTransitionCollector extends ValidiumStateTransitionCollector<
  typeof LogUpdateState
> {
  constructor(...p: ConstructorArgs) {
    super(...p, LogUpdateState)
  }
}

export class PerpetualValidiumStateTransitionCollector extends ValidiumStateTransitionCollector<
  typeof LogUpdateState
> {
  constructor(...p: ConstructorArgs) {
    super(...p, LogUpdateState)
  }
}
