import { BlockRange } from '../model'
import { BlockNumber } from '../peripherals/ethereum/types'
import { PerpetualRollupStateTransition } from './PerpetualRollupUpdater'
import { ValidiumStateTransition } from './PerpetualValidiumUpdater'

export interface IDataSyncService {
  sync(blockRange: BlockRange): Promise<void>
  processStateUpdates(
    stateTransitions:
      | ValidiumStateTransition[]
      | PerpetualRollupStateTransition[]
  ): Promise<void>
  discardAfter(blockNumber: BlockNumber): Promise<void>
}
