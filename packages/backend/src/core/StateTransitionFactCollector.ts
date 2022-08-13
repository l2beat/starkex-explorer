import { EthereumAddress } from '@explorer/types/src/EthereumAddress'
import { utils } from 'ethers'

import { BlockRange } from '../model/BlockRange'
import {
  StateTransitionFactRecord,
  StateTransitionFactRepository,
} from '../peripherals/database/StateTransitionFactsRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'

const PERPETUAL_ABI = new utils.Interface([
  'event LogStateTransitionFact(bytes32 stateTransitionFact)',
])

/** @internal exported only for tests */
export const LOG_STATE_TRANSITION_FACT = PERPETUAL_ABI.getEventTopic(
  'LogStateTransitionFact'
)

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
      topics: [LOG_STATE_TRANSITION_FACT],
    })
    const records = logs.map((log): Omit<StateTransitionFactRecord, 'id'> => {
      const event = PERPETUAL_ABI.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        hash: event.args.stateTransitionFact,
      }
    })

    await this.stateTransitionFactRepository.addMany(records)
    return records
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.stateTransitionFactRepository.deleteAfter(lastToKeep)
  }
}
