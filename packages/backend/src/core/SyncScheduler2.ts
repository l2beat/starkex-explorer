import assert from 'assert'

import { BlockRange, Hash256 } from '../model'
import { Logger } from '../tools/Logger'
import { BlockDownloader } from './BlockDownloader'
import { DataSyncService } from './DataSyncService'

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

/** @internal */
export const SYNC_BATCH_SIZE = 6000

export type SyncSchedulerAction =
  | { type: 'init'; blocks: Block[] }
  | { type: 'newBlocks'; blocks: Block[] }
  | { type: 'reorg'; blocks: Block[] }
  | { type: 'syncFinished'; success: boolean }
  | { type: 'discardFinished'; success: boolean }

/** @internal */
export function syncSchedulerReducer(
  state: SyncState,
  action: SyncSchedulerAction
): StateAndEffects {
  // console.log('>> action', action.type)
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
  // console.log('>> process() received state', state)
  // console.log(
  //   '>> process will proceed',
  //   state.isInitialized && !state.isProcessing
  // )
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

/** blocks in order and without gaps */
export class ContinuousBlocks {
  constructor(private readonly blocks: readonly Block[] = []) {
    assertContinuous(this.blocks)
  }

  get first(): Block | undefined {
    return this.blocks[0]
  }

  /**
   * @returns new continuous blocks prepended with blocks earlier than `first.number`
   *
   * - we use this to handle deep reorganizations
   */
  prependEarlier(newStart: readonly Block[]) {
    return new ContinuousBlocks(
      newStart
        .filter((x) => x.number < (this.first?.number ?? Infinity))
        .concat(this.blocks)
    )
  }

  replaceTail(newTail: readonly Block[]) {
    return new ContinuousBlocks(
      this.blocks.filter((x) => x.number < newTail[0].number).concat(newTail)
    )
  }

  concat(newBlocks: readonly Block[]) {
    return new ContinuousBlocks(this.blocks.concat(newBlocks))
  }

  take(end: number) {
    return [
      this.blocks.slice(0, end),
      new ContinuousBlocks(this.blocks.slice(end)),
    ] as const
  }
}

/** @internal */
export const INITIAL_SYNC_STATE: SyncState = {
  isInitialized: false,
  blocksToProcess: new ContinuousBlocks(),
  blocksProcessing: [],
  isProcessing: false,
  discardRequired: false,
  latestBlockProcessed: 0,
}

export type SyncSchedulerEffectHandlers = {
  [P in SyncSchedulerEffect]: (state: SyncState) => void
}

export class SyncScheduler {
  private state: SyncState = INITIAL_SYNC_STATE
  private readonly effects: SyncSchedulerEffectHandlers

  constructor(
    private readonly blockDownloader: BlockDownloader,
    private readonly dataSyncService: DataSyncService,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
    this.effects = {
      sync: ({ blocksProcessing }) =>
        this.dataSyncService.sync(new BlockRange(blocksProcessing)),
      discardAfter: ({ blocksToProcess }) =>
        this.dataSyncService.discardAfter(blocksToProcess.first!.number - 1),
    }
  }

  dispatch(action: SyncSchedulerAction) {
    const [newState, effects] = syncSchedulerReducer(this.state, action)

    effects.forEach((effect) => this.effects[effect](newState))

    this.logger.debug({
      method: 'dispatch',
      action: action.type,
      ...('success' in action && { success: action.success }),
      ...('blocks' in action &&
        action.blocks.length && {
          blocksRange: [
            action.blocks[0]!.number,
            action.blocks[action.blocks.length - 1]!.number,
          ].join(' - '),
        }),
    })

    this.state = newState
  }

  async start() {}
}

function assertContinuous(blocks: readonly Block[]): void {
  for (let i = 1; i < blocks.length; ++i) {
    const current = blocks[i]
    const previous = blocks[i - 1]

    if (current.number !== previous.number + 1) {
      throw new Error('Blocks are not continuous. Gap found at index: ' + i)
    }
  }
}

export interface Block {
  readonly number: number
  readonly hash: Hash256
}
