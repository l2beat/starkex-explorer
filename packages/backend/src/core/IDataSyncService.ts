import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { PerpetualRollupStateTransition } from './PerpetualRollupUpdater'
import { ValidiumStateTransition } from './PerpetualValidiumUpdater'

export interface IDataSyncService {
  sync(blockRange: BlockRange, isTip?: boolean): Promise<void>
  // I made isTip optional but as soon as we will support other types like PerpetualRollup etc. we will need to make it required.
  processStateTransitions(
    stateTransitions:
      | ValidiumStateTransition[]
      | PerpetualRollupStateTransition[]
  ): Promise<number | void>
  discardAfter(blockNumber: BlockNumber): Promise<void>
}
