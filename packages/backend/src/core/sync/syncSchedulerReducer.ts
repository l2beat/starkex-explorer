import assert from 'assert'

import { Block, ContinuousBlocks } from './ContinuousBlocks'

export const INITIAL_SYNC_STATE: SyncState = {
  isInitialized: false,
  blocksToProcess: new ContinuousBlocks(),
  blocksProcessing: [],
  isProcessing: false,
  discardRequired: false,
  latestBlockProcessed: 0,
}

export const SYNC_BATCH_SIZE = 6000

export interface SyncState {
  /** Have we read the initial blocks from db already? */
  readonly isInitialized: boolean
  /** Is sync or discard being executed? */
  readonly isProcessing: boolean
  readonly discardRequired: boolean
  readonly blocksToProcess: ContinuousBlocks
  readonly blocksProcessing: Block[]
  readonly latestBlockProcessed: number
}

export type SyncSchedulerEffect = 'sync' | 'discardAfter'
export type StateAndEffects = [SyncState, SyncSchedulerEffect[]]

export type SyncSchedulerAction =
  | { type: 'init'; blocks: Block[] }
  | { type: 'newBlocks'; blocks: Block[] }
  | { type: 'reorg'; blocks: Block[] }
  | { type: 'syncFinished'; success: boolean }
  | { type: 'discardFinished'; success: boolean }

export function syncSchedulerReducer(
  state: SyncState,
  action: SyncSchedulerAction
): StateAndEffects {
  switch (action.type) {
    case 'init': {
      assert(!state.isInitialized)

      return process({
        ...state,
        isInitialized: true,
        blocksToProcess: state.blocksToProcess.prependEarlier(action.blocks),
      })
    }

    case 'newBlocks': {
      return process({
        ...state,
        blocksToProcess: state.blocksToProcess.concat(action.blocks),
      })
    }

    case 'reorg': {
      if (state.latestBlockProcessed >= action.blocks[0].number) {
        return process({
          ...state,
          discardRequired: true,
          blocksToProcess: new ContinuousBlocks(action.blocks),
        })
      } else {
        return process({
          ...state,
          blocksToProcess: state.blocksToProcess.replaceTail(action.blocks),
        })
      }
    }

    case 'discardFinished': {
      return process({
        ...state,
        isProcessing: false,
        discardRequired: action.success ? false : state.discardRequired,
      })
    }

    case 'syncFinished': {
      return process({
        ...state,
        isProcessing: false,
        blocksToProcess: action.success
          ? state.blocksToProcess
          : state.blocksToProcess.prependEarlier(state.blocksProcessing),
        blocksProcessing: [],
      })
    }
  }
}

function process(state: SyncState): StateAndEffects {
  if (!state.isInitialized || state.isProcessing) return [state, []]

  if (state.discardRequired) {
    return [{ ...state, isProcessing: true }, ['discardAfter']]
  } else {
    const [blocksProcessing, blocksToProcess] =
      state.blocksToProcess.take(SYNC_BATCH_SIZE)

    if (blocksProcessing.length > 0) {
      const latestBlockProcessed =
        blocksProcessing[blocksProcessing.length - 1].number

      return [
        {
          ...state,
          blocksProcessing,
          blocksToProcess,
          isProcessing: true,
          latestBlockProcessed,
        },
        ['sync'],
      ]
    } else {
      return [{ ...state, blocksProcessing }, []]
    }
  }
}
