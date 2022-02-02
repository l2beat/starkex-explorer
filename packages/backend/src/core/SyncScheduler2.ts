import assert from 'assert'

import { Hash256 } from '../model'
import { Logger } from '../tools/Logger'

interface SyncState {
  /** Have we read the initial blocks from db already? */
  readonly isInitialized: boolean
  /** Is sync or discard being executed? */
  readonly isProcessing: boolean
  readonly reorgRequired: boolean
  readonly blocks: ContinuousBlocks
  readonly blocksProcessing: Block[]
  readonly latestBlock: number
}

type SyncSchedulerEffect = 'sync' | 'discardAfter'
type StateAndEffects = [SyncState, SyncSchedulerEffect[]]

const SYNC_BATCH_SIZE = 6000

/** @internal */
export function onInit(
  state: SyncState,
  blocks: Block[],
  latestBlock: number
): StateAndEffects {
  assert(!state.isInitialized)

  return process({
    ...state,
    isInitialized: true,
    latestBlock,
    blocks: state.blocks.prependEarlier(blocks),
  })
}

/** @internal */
export function onNewBlocks(
  state: SyncState,
  blocks: Block[]
): StateAndEffects {
  const newState = {
    ...state,
    blocks: state.blocks.concat(blocks),
  }

  return state.isInitialized && !state.isProcessing
    ? process(newState)
    : [newState, []]
}

/** @internal */
export function onSyncFinished(state: SyncState, success: boolean) {
  return process({
    ...state,
    isProcessing: false,
    blocks: success
      ? state.blocks
      : state.blocks.prependEarlier(state.blocksProcessing),
    blocksProcessing: [],
  })
}

/** @internal */
export function onDiscardFinished(
  state: SyncState,
  success: boolean
): StateAndEffects {
  return process({
    ...state,
    isProcessing: false,
    reorgRequired: success ? state.reorgRequired : false,
  })
}

/** @internal */
export function process(state: SyncState): StateAndEffects {
  assert(!state.isProcessing)
  if (!state.reorgRequired) {
    const [blocksProcessing, blocks] = state.blocks.takeFirst(SYNC_BATCH_SIZE)
    if (blocksProcessing.length > 0) {
      const latestBlock = blocksProcessing[blocksProcessing.length - 1].number

      return [
        { ...state, blocksProcessing, blocks, isProcessing: true, latestBlock },
        ['sync'],
      ]
    } else {
      return [{ ...state, blocksProcessing }, []]
    }
  } else {
    return [{ ...state, isProcessing: true }, ['discardAfter']]
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
  prependEarlier(blocks: readonly Block[]) {
    return new ContinuousBlocks(
      blocks
        .filter((x) => x.number < (this.first?.number ?? Infinity))
        .concat(this.blocks)
    )
  }

  concat(newBlocks: readonly Block[]) {
    return new ContinuousBlocks(this.blocks.concat(newBlocks))
  }

  takeFirst(end: number) {
    return [
      this.blocks.slice(0, end),
      new ContinuousBlocks(this.blocks.slice(end)),
    ] as const
  }
}

const INITIAL_SYNC_STATE = {
  isInitialized: false,
  blocks: new ContinuousBlocks(),
  blocksProcessing: [],
  isProcessing: false,
  reorgRequired: false,
  latestBlock: 0,
}

const actionHandlers = {
  init: onInit,
  newBlocks: onNewBlocks,
  syncFinished: onSyncFinished,
  discardFinished: onDiscardFinished,
}

type Tail<T extends readonly unknown[]> = T extends [unknown, ...infer R]
  ? R
  : never

export type SyncSchedulerAction = {
  [A in keyof typeof actionHandlers]: [
    type: A,
    ...rest: Tail<Parameters<typeof actionHandlers[A]>>
  ]
}[keyof typeof actionHandlers]

export type SyncSchedulerEffectHandlers = {
  [P in SyncSchedulerEffect]: (state: SyncState) => void
}

export class SyncScheduler {
  private state: SyncState = INITIAL_SYNC_STATE

  constructor(
    /**
     * @example
     * {
     *   sync: ({ blocksProcessing }) => sync(new BlockRange(blocksProcessing))
     *   discardAfter: ({ blocks }) => discardAfter(blocks.first!.number - 1)
     * }
     */
    private readonly effects: SyncSchedulerEffectHandlers,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  dispatch(...action: SyncSchedulerAction) {
    const [actionType, ...args] = action
    const actionHandler = actionHandlers[actionType]

    // Uhh, TypeScript would want us to write a trivial switchcase here 🤷‍♂️
    const _actionHandler = actionHandler as UnionToIntersection<
      typeof actionHandler
    >
    const _args = args as Tail<Parameters<typeof _actionHandler>>

    const [newState, effects] = _actionHandler(this.state, ..._args)

    console.log('[]SyncScheduler]', this.state, action, newState)

    effects.forEach((effect) => this.effects[effect](newState))
    this.state = newState
  }
}

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R
) => any
  ? R
  : never

function assertContinuous(blocks: readonly Block[]): void {
  for (let i = 1; i < blocks.length; ++i) {
    const current = blocks[i]
    const previous = blocks[i - 1]

    if (current.number !== previous.number + 1) {
      throw new Error('Blocks are not continuous. Gap found at index: ' + i)
    }
  }
}

interface Block {
  readonly number: number
  readonly hash: Hash256
}
