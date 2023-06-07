import { BlockRange } from '../model'
import { PerpetualRollupStateTransition } from './PerpetualRollupUpdater'
import { ValidiumStateTransition } from './PerpetualValidiumUpdater'

export interface IStateTransitionCollector {
  collect(
    blockRange: BlockRange,
    skipAddingToDb: boolean
  ): Promise<ValidiumStateTransition[] | PerpetualRollupStateTransition[]>
  discardAfter(blockNumber: number): Promise<void>
}
