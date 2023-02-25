import { Hash256 } from '@explorer/types'

import { BlockRange } from '../../model'

export interface Block {
  readonly number: number
  readonly hash: Hash256
}

export const INITIAL_SYNC_STATE: SyncState = {
  isProcessing: false,
  remaining: new BlockRange([]),
  discardAfter: undefined,
}

export const SYNC_BATCH_SIZE = 1000

export interface SyncState {
  readonly isProcessing: boolean
  readonly remaining: BlockRange
  readonly discardAfter: number | undefined
}

export type SyncSchedulerEffect =
  | { type: 'sync'; blocks: BlockRange }
  | { type: 'discardAfter'; blockNumber: number }

export type StateAndEffects = [SyncState, SyncSchedulerEffect?]

export type SyncSchedulerAction =
  | { type: 'initialized'; lastSynced: number; knownBlocks: Block[] }
  | { type: 'newBlockFound'; block: Block }
  | { type: 'reorgOccurred'; blocks: Block[] }
  | { type: 'syncSucceeded' }
  | { type: 'syncFailed'; blocks: BlockRange }
  | { type: 'discardAfterSucceeded'; blockNumber: number }
  | { type: 'discardAfterFailed' }

export function syncSchedulerReducer(
  state: SyncState,
  action: SyncSchedulerAction
): StateAndEffects {
  switch (action.type) {
    case 'initialized': {
      return process({
        isProcessing: false,
        remaining: new BlockRange(action.knownBlocks, action.lastSynced + 1),
        discardAfter: undefined,
      })
    }
    case 'newBlockFound': {
      return process({
        ...state,
        remaining: state.remaining.merge([action.block]),
      })
    }
    case 'reorgOccurred': {
      const reorgStart = Math.min(...action.blocks.map((x) => x.number))
      return process({
        ...state,
        remaining: state.remaining.merge(action.blocks),
        discardAfter:
          state.discardAfter !== undefined
            ? Math.min(reorgStart - 1, state.discardAfter)
            : reorgStart < state.remaining.start
            ? reorgStart - 1
            : undefined,
      })
    }
    case 'syncSucceeded': {
      return process({
        ...state,
        isProcessing: false,
      })
    }
    case 'syncFailed': {
      return process({
        ...state,
        isProcessing: false,
        remaining: action.blocks.merge(state.remaining),
      })
    }
    case 'discardAfterSucceeded': {
      return process({
        ...state,
        isProcessing: false,
        discardAfter:
          state.discardAfter === action.blockNumber
            ? undefined
            : state.discardAfter,
      })
    }
    case 'discardAfterFailed': {
      return process({
        ...state,
        isProcessing: false,
      })
    }
  }
}

function process(state: SyncState): StateAndEffects {
  if (state.isProcessing || state.remaining.isEmpty()) {
    return [state]
  } else if (!state.discardAfter) {
    const [toProcess, remaining] = state.remaining.take(SYNC_BATCH_SIZE)
    return [
      { isProcessing: true, remaining, discardAfter: undefined },
      { type: 'sync', blocks: toProcess },
    ]
  } else {
    return [
      { ...state, isProcessing: true },
      { type: 'discardAfter', blockNumber: state.discardAfter },
    ]
  }
}
