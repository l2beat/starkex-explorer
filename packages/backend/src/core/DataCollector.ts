import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { StateTransition } from './StateUpdater'

export interface IDataCollector {
  collect(blockRange: BlockRange): Promise<StateTransition[]>
  discardAfter(blockNumber: BlockNumber): Promise<void>
}
