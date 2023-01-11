import { Hash256 } from '@explorer/types'
import { EthereumAddress } from '@explorer/types/src/EthereumAddress'

import { BlockRange } from '../../model/BlockRange'
import {
  StateTransitionRecord,
  StateTransitionRepository,
} from '../../peripherals/database/StateTransitionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { LogStateTransitionFact } from './events'

export class PerpetualRollupStateTransitionCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly stateTransitionRepository: StateTransitionRepository,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async collect(
    blockRange: BlockRange
  ): Promise<Omit<StateTransitionRecord, 'id'>[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [LogStateTransitionFact.topic],
    })
    const records = logs.map((log): Omit<StateTransitionRecord, 'id'> => {
      const event = LogStateTransitionFact.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        stateTransitionHash: Hash256(event.args.stateTransitionFact),
      }
    })

    await this.stateTransitionRepository.addMany(records)
    return records
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.stateTransitionRepository.deleteAfter(lastToKeep)
  }
}
