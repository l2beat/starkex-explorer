import { Hash256 } from '@explorer/types'
import { expect } from 'earljs'

import {
  Block,
  INITIAL_SYNC_STATE,
  StateAndEffects,
  SyncSchedulerAction,
  syncSchedulerReducer,
  SyncState,
} from '../../../src/core/sync/syncSchedulerReducer'
import { BlockRange } from '../../../src/model'

describe(syncSchedulerReducer.name, () => {
  const block = (number: number, version?: 'a' | 'b'): Block => ({
    number,
    hash: Hash256.fake(number.toString() + (version ?? '')),
  })

  const reduce = (
    actions: SyncSchedulerAction[],
    initialState: Partial<SyncState> = {}
  ) =>
    actions.reduce<StateAndEffects>(
      ([state], action) => syncSchedulerReducer(state, action),
      [{ ...INITIAL_SYNC_STATE, ...initialState }]
    )

  describe('initialized', () => {
    it('initializes the state and triggers sync', () => {
      const [state, effect] = reduce([
        {
          type: 'initialized',
          lastSynced: 1000,
          knownBlocks: [block(1499), block(1500)],
        },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([], 1501, 1501),
        discardAfter: undefined,
      })
      expect(effect).toEqual({
        type: 'sync',
        blocks: new BlockRange([block(1499), block(1500)], 1001, 1501),
      })
    })

    it('does not trigger sync when there are no known blocks', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [] },
      ])
      expect(state).toEqual({
        isProcessing: false,
        remaining: new BlockRange([], 1001, 1001),
        discardAfter: undefined,
      })
      expect(effect).toEqual(undefined)
    })

    it('batches the sync', () => {
      const [state, effect] = reduce([
        {
          type: 'initialized',
          lastSynced: 1000,
          knownBlocks: [block(2_000_000)],
        },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([block(2_000_000)], 7001, 2_000_001),
        discardAfter: undefined,
      })
      expect(effect).toEqual({
        type: 'sync',
        blocks: new BlockRange([], 1001, 7001),
      })
    })
  })

  describe('newBlockFound', () => {
    it('triggers sync if nothing is processing', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [] },
        { type: 'newBlockFound', block: block(1001) },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([], 1002, 1002),
        discardAfter: undefined,
      })
      expect(effect).toEqual({
        type: 'sync',
        blocks: new BlockRange([block(1001)]),
      })
    })

    it('appends remaining blocks when something is processing', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [block(1001)] },
        { type: 'newBlockFound', block: block(1002) },
        { type: 'newBlockFound', block: block(1003) },
        { type: 'newBlockFound', block: block(1004) },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([block(1002), block(1003), block(1004)]),
        discardAfter: undefined,
      })
      expect(effect).toEqual(undefined)
    })
  })

  describe('reorgOccurred', () => {
    it('triggers discardAfter if nothing is processing', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [] },
        { type: 'reorgOccurred', blocks: [block(999, 'a'), block(1000, 'a')] },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([block(999, 'a'), block(1000, 'a')]),
        discardAfter: 998,
      })
      expect(effect).toEqual({
        type: 'discardAfter',
        blockNumber: 998,
      })
    })

    it('changes the blocks if it is not deep enough', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [block(1001)] },
        { type: 'newBlockFound', block: block(1002) },
        { type: 'newBlockFound', block: block(1003) },
        { type: 'newBlockFound', block: block(1004) },
        { type: 'reorgOccurred', blocks: [block(1003, 'a'), block(1004, 'a')] },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([
          block(1002),
          block(1003, 'a'),
          block(1004, 'a'),
        ]),
        discardAfter: undefined,
      })
      expect(effect).toEqual(undefined)
    })

    it('changes the blocks if it is shallower than existing reorg', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [block(1001)] },
        { type: 'reorgOccurred', blocks: [block(1000, 'a'), block(1001, 'a')] },
        { type: 'reorgOccurred', blocks: [block(1001, 'b')] },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([block(1000, 'a'), block(1001, 'b')]),
        discardAfter: 999,
      })
      expect(effect).toEqual(undefined)
    })

    it('schedules a deeper reorg', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [block(1001)] },
        { type: 'reorgOccurred', blocks: [block(1000, 'a'), block(1001, 'a')] },
        {
          type: 'reorgOccurred',
          blocks: [block(999, 'b'), block(1000, 'b'), block(1001, 'b')],
        },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([
          block(999, 'b'),
          block(1000, 'b'),
          block(1001, 'b'),
        ]),
        discardAfter: 998,
      })
      expect(effect).toEqual(undefined)
    })
  })

  describe('syncSucceeded', () => {
    it('stops processing if remaining is empty', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [] },
        { type: 'newBlockFound', block: block(1001) },
        { type: 'syncSucceeded' },
      ])
      expect(state).toEqual({
        isProcessing: false,
        remaining: new BlockRange([], 1002, 1002),
        discardAfter: undefined,
      })
      expect(effect).toEqual(undefined)
    })

    it('starts a new sync if needed', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [] },
        { type: 'newBlockFound', block: block(1001) },
        // syncing starts at this point
        { type: 'newBlockFound', block: block(1002) },
        { type: 'syncSucceeded' },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([], 1003, 1003),
        discardAfter: undefined,
      })
      expect(effect).toEqual({
        type: 'sync',
        blocks: new BlockRange([block(1002)]),
      })
    })

    it('starts a new discardAfter if needed', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [] },
        { type: 'newBlockFound', block: block(1001) },
        // syncing starts at this point
        {
          type: 'reorgOccurred',
          blocks: [block(999, 'a'), block(1000, 'a'), block(1001, 'a')],
        },
        { type: 'syncSucceeded' },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([
          block(999, 'a'),
          block(1000, 'a'),
          block(1001, 'a'),
        ]),
        discardAfter: 998,
      })
      expect(effect).toEqual({
        type: 'discardAfter',
        blockNumber: 998,
      })
    })
  })

  describe('syncFailed', () => {
    it('retries', () => {
      const [state, effect] = reduce([
        {
          type: 'initialized',
          lastSynced: 997,
          knownBlocks: [block(998), block(999)],
        },
        {
          type: 'syncFailed',
          blocks: new BlockRange([block(998), block(999)]),
        },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([], 1000, 1000),
        discardAfter: undefined,
      })
      expect(effect).toEqual({
        type: 'sync',
        blocks: new BlockRange([block(998), block(999)]),
      })
    })

    it('retries with new blocks', () => {
      const [state, effect] = reduce([
        {
          type: 'initialized',
          lastSynced: 997,
          knownBlocks: [block(998), block(999)],
        },
        // syncing starts at this point
        { type: 'newBlockFound', block: block(1000) },
        { type: 'newBlockFound', block: block(1001) },
        {
          type: 'syncFailed',
          blocks: new BlockRange([block(998), block(999)]),
        },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([], 1002, 1002),
        discardAfter: undefined,
      })
      expect(effect).toEqual({
        type: 'sync',
        blocks: new BlockRange([
          block(998),
          block(999),
          block(1000),
          block(1001),
        ]),
      })
    })

    it('returns relevant blocks and discards if needed', () => {
      const [state, effect] = reduce([
        {
          type: 'initialized',
          lastSynced: 997,
          knownBlocks: [block(998), block(999)],
        },
        // syncing starts at this point
        { type: 'reorgOccurred', blocks: [block(999, 'a'), block(1000, 'a')] },
        {
          type: 'syncFailed',
          blocks: new BlockRange([block(998), block(999)]),
        },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([
          block(998),
          block(999, 'a'),
          block(1000, 'a'),
        ]),
        discardAfter: 998,
      })
      expect(effect).toEqual({
        type: 'discardAfter',
        blockNumber: 998,
      })
    })

    it('performs a deep discard if needed', () => {
      const [state, effect] = reduce([
        {
          type: 'initialized',
          lastSynced: 997,
          knownBlocks: [block(998), block(999)],
        },
        // syncing starts at this point
        {
          type: 'reorgOccurred',
          blocks: [
            block(997, 'a'),
            block(998, 'a'),
            block(999, 'a'),
            block(1000, 'a'),
          ],
        },
        {
          type: 'syncFailed',
          blocks: new BlockRange([block(998), block(999)]),
        },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([
          block(997, 'a'),
          block(998, 'a'),
          block(999, 'a'),
          block(1000, 'a'),
        ]),
        discardAfter: 996,
      })
      expect(effect).toEqual({
        type: 'discardAfter',
        blockNumber: 996,
      })
    })
  })

  describe('discardAfterSucceeded', () => {
    it('proceeds to sync', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [] },
        { type: 'reorgOccurred', blocks: [block(999, 'a'), block(1000, 'a')] },
        { type: 'discardAfterSucceeded', blockNumber: 998 },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([], 1001, 1001),
        discardAfter: undefined,
      })
      expect(effect).toEqual({
        type: 'sync',
        blocks: new BlockRange([block(999, 'a'), block(1000, 'a')]),
      })
    })

    it('remembers about bigger reorgs', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [] },
        { type: 'reorgOccurred', blocks: [block(999, 'a'), block(1000, 'a')] },
        {
          type: 'reorgOccurred',
          blocks: [block(998, 'b'), block(999, 'b'), block(1000, 'b')],
        },
        { type: 'discardAfterSucceeded', blockNumber: 998 },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([
          block(998, 'b'),
          block(999, 'b'),
          block(1000, 'b'),
        ]),
        discardAfter: 997,
      })
      expect(effect).toEqual({
        type: 'discardAfter',
        blockNumber: 997,
      })
    })
  })

  describe('discardAfterFailed', () => {
    it('retries', () => {
      const [state, effect] = reduce([
        { type: 'initialized', lastSynced: 1000, knownBlocks: [] },
        { type: 'reorgOccurred', blocks: [block(999, 'a'), block(1000, 'a')] },
        { type: 'discardAfterFailed' },
      ])
      expect(state).toEqual({
        isProcessing: true,
        remaining: new BlockRange([block(999, 'a'), block(1000, 'a')]),
        discardAfter: 998,
      })
      expect(effect).toEqual({
        type: 'discardAfter',
        blockNumber: 998,
      })
    })
  })
})
