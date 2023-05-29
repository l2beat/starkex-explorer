import { BlockRange } from '../model'
import { StateUpdateRecord } from '../peripherals/database/StateUpdateRepository'
import { BlockNumber } from '../peripherals/ethereum/types'
import { PerpetualRollupStateTransition } from './PerpetualRollupUpdater'
import { ValidiumStateTransition } from './PerpetualValidiumUpdater'

export interface IDataSyncService {
  sync(blockRange: BlockRange): Promise<void>
  processStateUpdates(
    stateTransitions:
      | ValidiumStateTransition[]
      | PerpetualRollupStateTransition[]
  ): Promise<StateUpdateRecord[]>
  discardAfter(blockNumber: BlockNumber): Promise<void>
}
