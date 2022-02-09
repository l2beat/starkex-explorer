import { expect } from 'earljs'
import { range } from 'lodash'

import {
  Block,
  ContinuousBlocks,
} from '../../../src/core/sync/ContinuousBlocks'
import {
  INITIAL_SYNC_STATE,
  SYNC_BATCH_SIZE,
  SyncSchedulerAction,
  SyncSchedulerEffect,
  syncSchedulerReducer,
  SyncState,
} from '../../../src/core/sync/syncSchedulerReducer'
import { Hash256 } from '../../../src/model'

describe(syncSchedulerReducer.name, () => {
  describe('init', () => {
    it('accepts latestBlock and starts processing and sync', () => {
      const blocks = [fakeBlock(1), fakeBlock(2), fakeBlock(3)]
      const [state, effects] = syncSchedulerReducer(INITIAL_SYNC_STATE, {
        type: 'init',
        blocks,
      })

      expect(state).toEqual({
        isInitialized: true,
        isProcessing: true,
        discardRequired: false,
        latestBlockProcessed: 3,
        blocksToProcess: new ContinuousBlocks(),
        blocksProcessing: blocks,
      })
      expect(effects).toEqual('sync')
    })

    it(`triggers processing of up to ${SYNC_BATCH_SIZE} blocks at once`, () => {
      const blocksCount = SYNC_BATCH_SIZE + 500
      const blocks = range(blocksCount).map(fakeBlock)

      const [state, effects] = syncSchedulerReducer(INITIAL_SYNC_STATE, {
        type: 'init',
        blocks,
      })

      expect(state.blocksProcessing).toEqual(blocks.slice(0, SYNC_BATCH_SIZE))
      expect(effects).toEqual('sync')
    })
  })

  describe('syncFinished', () => {
    it('clears .blocksProcessing and .isProcessing flag on success', () => {
      const initialState: SyncState = {
        isInitialized: true,
        isProcessing: true,
        discardRequired: false,
        latestBlockProcessed: 3,
        blocksToProcess: new ContinuousBlocks(),
        blocksProcessing: [fakeBlock(1), fakeBlock(2), fakeBlock(3)],
      }

      const [newState, effects] = syncSchedulerReducer(initialState, {
        type: 'syncFinished',
        success: true,
      })

      expect(newState).toEqual({
        ...initialState,
        isProcessing: false,
        blocksProcessing: [],
      })
      expect(effects).toEqual(undefined)
    })

    it('moves blocks processing back to the queue and orders sync on failure', () => {
      const blocks = {
        a1: fakeBlock(1),
        a2: fakeBlock(2),
        a3: fakeBlock(3),
        b3: fakeBlock(3),
        b4: fakeBlock(4),
      }

      const initialState: SyncState = {
        isInitialized: true,
        isProcessing: true,
        discardRequired: false,
        latestBlockProcessed: 3,
        blocksToProcess: new ContinuousBlocks([blocks.b3, blocks.b4]),
        blocksProcessing: [blocks.a1, blocks.a2, blocks.a3],
      }

      const [newState, effects] = syncSchedulerReducer(initialState, {
        type: 'syncFinished',
        success: false,
      })

      expect(effects).toEqual('sync')
      expect(newState).toEqual({
        ...initialState,
        blocksToProcess: new ContinuousBlocks(),
        latestBlockProcessed: 4,
        blocksProcessing: [blocks.a1, blocks.a2, blocks.b3, blocks.b4],
      })
    })
  })

  describe('reorg', () => {
    it("doesn't cause discard given blocks not processed yet", () => {
      const oldBlocks = [fakeBlock(4), fakeBlock(5)]
      const initialState: SyncState = {
        isInitialized: true,
        isProcessing: true,
        discardRequired: false,
        latestBlockProcessed: 3,
        blocksToProcess: new ContinuousBlocks(oldBlocks),
        blocksProcessing: [fakeBlock(1), fakeBlock(2), fakeBlock(3)],
      }

      const newBlocks = [fakeBlock(4), fakeBlock(5)]
      const [newState, effects] = syncSchedulerReducer(initialState, {
        type: 'reorg',
        blocks: newBlocks,
      })

      expect(newState).toEqual({
        ...initialState,
        isProcessing: true,
        discardRequired: false,
        blocksToProcess: new ContinuousBlocks(newBlocks),
      })
      expect(effects).toEqual(undefined)
    })

    it('causes discard given blocks processed already', () => {
      const initialState: SyncState = {
        isInitialized: true,
        isProcessing: true,
        discardRequired: false,
        latestBlockProcessed: 3,
        blocksToProcess: new ContinuousBlocks([fakeBlock(5)]),
        blocksProcessing: [fakeBlock(4)],
      }

      const newBlocks = [fakeBlock(2), fakeBlock(3), fakeBlock(4)]

      let [newState, effects] = syncSchedulerReducer(initialState, {
        type: 'reorg',
        blocks: newBlocks,
      })

      expect(newState).toEqual({
        ...initialState,
        discardRequired: true,
        blocksToProcess: new ContinuousBlocks(newBlocks),
        latestBlockProcessed: 3,
      })

      // There is no `discard` yet, because we need to process old block 4 still.
      expect(effects).toEqual(undefined)
      ;[newState, effects] = syncSchedulerReducer(newState, {
        type: 'syncFinished',
        success: true,
      })

      expect(newState).toEqual({
        isInitialized: true,
        isProcessing: true,
        discardRequired: true,
        blocksToProcess: new ContinuousBlocks(newBlocks),
        latestBlockProcessed: 3,
        blocksProcessing: [],
      })
      expect(effects).toEqual('discardAfter')
    })
  })

  describe('newBlocks', () => {
    it('adds new blocks to process', () => {
      const blocks = {
        a9: fakeBlock(9),
        a10: fakeBlock(10),
        a11: fakeBlock(11),
        a12: fakeBlock(12),
      }

      const initialState: SyncState = {
        isInitialized: true,
        isProcessing: true,
        discardRequired: false,
        latestBlockProcessed: 8,
        blocksToProcess: new ContinuousBlocks([blocks.a10]),
        blocksProcessing: [blocks.a9],
      }

      const [newState, effects] = syncSchedulerReducer(initialState, {
        type: 'newBlocks',
        blocks: [blocks.a11, blocks.a12],
      })

      expect(effects).toEqual(undefined)
      expect(newState).toEqual({
        ...initialState,
        blocksToProcess: new ContinuousBlocks([
          blocks.a10,
          blocks.a11,
          blocks.a12,
        ]),
      })
    })

    it('throws error on gaps in block range', () => {
      const blocks = {
        a10: fakeBlock(10),
        a12: fakeBlock(12),
      }

      const initialState: SyncState = {
        isInitialized: true,
        isProcessing: false,
        discardRequired: false,
        latestBlockProcessed: 8,
        blocksToProcess: new ContinuousBlocks([blocks.a10]),
        blocksProcessing: [],
      }

      expect(() =>
        syncSchedulerReducer(initialState, {
          type: 'newBlocks',
          blocks: [blocks.a12],
        })
      ).toThrow('Blocks are not continuous. Gap found at index: 1')
    })
  })

  describe('discardFinished', () => {
    it('clears .discardRequired on success', () => {
      const initialState: SyncState = {
        isInitialized: true,
        blocksProcessing: [],
        blocksToProcess: new ContinuousBlocks(),
        latestBlockProcessed: 0,
        isProcessing: true,
        discardRequired: true,
      }

      const [newState, effects] = syncSchedulerReducer(initialState, {
        type: 'discardFinished',
        success: true,
      })

      expect(effects).toEqual(undefined)
      expect(newState).toEqual({
        ...initialState,
        isProcessing: false,
        discardRequired: false,
      })
    })

    it("doesn't clear .discardRequire on failure", () => {
      const initialState: SyncState = {
        ...INITIAL_SYNC_STATE,
        isProcessing: true,
        discardRequired: true,
      }

      const [newState, effects] = syncSchedulerReducer(initialState, {
        type: 'discardFinished',
        success: false,
      })

      expect(effects).toEqual(undefined)
      expect(newState).toEqual({
        ...initialState,
        isProcessing: false,
        discardRequired: true,
      })
    })
  })

  it('while blocks are being read from db new blocks are found', () => {
    // `init` happens after `newBlocks`
    const blocks = [
      fakeBlock(1),
      fakeBlock(2),
      fakeBlock(3),
      fakeBlock(4),
      fakeBlock(5),
      fakeBlock(6),
    ]

    let [state, effects] = syncSchedulerReducer(INITIAL_SYNC_STATE, {
      type: 'newBlocks',
      blocks: blocks.slice(2),
    })

    expect(state).toEqual({
      isInitialized: false,
      blocksToProcess: new ContinuousBlocks(blocks.slice(2)),
      blocksProcessing: [],
      isProcessing: false,
      discardRequired: false,
      latestBlockProcessed: 0,
    })
    expect(effects).toEqual(undefined)
    ;[state, effects] = syncSchedulerReducer(state, {
      type: 'init',
      blocks: blocks.slice(0, 4),
    })

    expect(state).toEqual({
      isInitialized: true,
      blocksToProcess: new ContinuousBlocks(),
      blocksProcessing: blocks,
      isProcessing: true,
      latestBlockProcessed: 6,
      discardRequired: false,
    })
    expect(effects).toEqual('sync')
  })

  it('handles reorg in blocks known from before the server start', () => {
    const blocks = {
      a1: fakeBlock(1),
      a2: fakeBlock(2),
      a3: fakeBlock(3),
      b2: fakeBlock(2),
      b3: fakeBlock(3),
    }

    const actions: SyncSchedulerAction[] = [
      { type: 'init', blocks: [blocks.a1, blocks.a2, blocks.a3] },
      { type: 'reorg', blocks: [blocks.b2, blocks.b3] },
      { type: 'syncFinished', success: true },
      { type: 'discardFinished', success: true },
      { type: 'syncFinished', success: true },
    ]

    const results = reduceAndConcat(actions)

    expect(results).toEqual([
      [
        {
          isInitialized: true,
          isProcessing: true,
          latestBlockProcessed: 3,
          blocksProcessing: [blocks.a1, blocks.a2, blocks.a3],
          blocksToProcess: new ContinuousBlocks(),
        },
        'sync',
      ],
      [
        {
          discardRequired: true,
          blocksToProcess: new ContinuousBlocks([blocks.b2, blocks.b3]),
        },
        undefined,
      ],
      [
        {
          blocksProcessing: [],
        },
        'discardAfter',
      ],
      [
        {
          discardRequired: false,
          blocksProcessing: [blocks.b2, blocks.b3],
          blocksToProcess: new ContinuousBlocks(),
        },
        'sync',
      ],
      [
        {
          blocksProcessing: [],
          isProcessing: false,
        },
        undefined,
      ],
    ])
  })
})

function reduceAndConcat(
  actions: SyncSchedulerAction[],
  initialState = INITIAL_SYNC_STATE
) {
  const results = actions.reduce<Array<[SyncState, SyncSchedulerEffect?]>>(
    (acc, action) => {
      const prevState = acc[acc.length - 1][0]
      return [...acc, syncSchedulerReducer(prevState, action)]
    },
    [[initialState]]
  )

  return results.slice(1).map((result, i) => {
    const [state, effects] = result
    const [prevState] = results[i]
    const stateDelta = Object.fromEntries(
      Object.entries(state).filter(
        ([k, v]) => v !== prevState[k as keyof SyncState]
      )
    ) as Partial<SyncState>

    return [stateDelta, effects] as const
  })
}

function fakeBlock(number: number): Block {
  return {
    number,
    hash: Hash256.fake(),
  }
}
