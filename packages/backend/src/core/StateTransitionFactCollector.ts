import { utils } from 'ethers'

import {
  StateTransitionFactRecord,
  StateTransitionFactRepository,
} from '../peripherals/database/StateTransitionFactsRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber, BlockRange } from '../peripherals/ethereum/types'

const PERPETUAL_ADDRESS = '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'

const PERPETUAL_ABI = new utils.Interface([
  'event LogStateTransitionFact(bytes32 stateTransitionFact)',
])

export class StateTransitionFactCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly stateTransitionFactRepository: StateTransitionFactRepository
  ) {}

  async collect(blockRange: BlockRange): Promise<StateTransitionFactRecord[]> {
    const logs = await this.ethereumClient.getLogs({
      address: PERPETUAL_ADDRESS,
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [PERPETUAL_ABI.getEventTopic('LogStateTransitionFact')],
    })

    // @todo temp
    console.log('>>', { logs })

    return logs.map((log): StateTransitionFactRecord => {
      const event = PERPETUAL_ABI.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        hash: event.args.stateTransitionFact,
      }
    })
  }

  async discard({ from }: { from: BlockNumber }) {
    await this.stateTransitionFactRepository.deleteAllAfter(from)
  }
}
