import { Hash256 } from '@explorer/types'
import { EthereumAddress } from '@explorer/types/src/EthereumAddress'

import { BlockRange } from '../../model/BlockRange'
import {
  StateTransitionFactRecord,
  StateTransitionFactRepository,
} from '../../peripherals/database/StateTransitionFactsRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { LogStateTransitionFact } from './events'

export class StateTransitionFactCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly stateTransitionFactRepository: StateTransitionFactRepository,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async collect(
    blockRange: BlockRange
  ): Promise<Omit<StateTransitionFactRecord, 'id'>[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [LogStateTransitionFact.topic],
    })
    const records = logs.map((log): Omit<StateTransitionFactRecord, 'id'> => {
      const event = LogStateTransitionFact.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        hash: Hash256(event.args.stateTransitionFact),
      }
    })

    await this.stateTransitionFactRepository.addMany(records)
    return records
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.stateTransitionFactRepository.deleteAfter(lastToKeep)
  }
}
