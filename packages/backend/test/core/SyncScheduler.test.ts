import { expect, mockFn } from 'earljs'
import { range } from 'lodash'
import waitForExpect from 'wait-for-expect'

import { BlockDownloader } from '../../src/core/BlockDownloader'
import { DataSyncService } from '../../src/core/DataSyncService'
import {
  Block,
  ContinuousBlocks,
  INITIAL_SYNC_STATE,
  SYNC_BATCH_SIZE,
  SyncScheduler,
  SyncSchedulerAction,
  SyncSchedulerEffect,
  syncSchedulerReducer,
  SyncState,
} from '../../src/core/SyncScheduler'
import { BlockRange, Hash256 } from '../../src/model'
import { BlockRecord } from '../../src/peripherals/database/BlockRepository'
import { SyncStatusRepository } from '../../src/peripherals/database/SyncStatusRepository'
import { Logger, LogLevel } from '../../src/tools/Logger'
import { mock } from '../mock'

describe(SyncScheduler.name, () => {
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
        expect(effects).toEqual(['sync'])
      })

      it(`triggers processing of up to ${SYNC_BATCH_SIZE} blocks at once`, () => {
        const blocksCount = SYNC_BATCH_SIZE + 500
        const blocks = range(blocksCount).map(fakeBlock)

        const [state, effects] = syncSchedulerReducer(INITIAL_SYNC_STATE, {
          type: 'init',
          blocks,
        })

        expect(state.blocksProcessing).toEqual(blocks.slice(0, SYNC_BATCH_SIZE))
        expect(effects).toEqual(['sync'])
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
        expect(effects).toEqual([])
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

        expect(effects).toEqual(['sync'])
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
        expect(effects).toEqual([])
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
        expect(effects).toEqual([])
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
        expect(effects).toEqual(['discardAfter'])
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

        expect(effects).toEqual([])
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

        expect(effects).toEqual([])
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

        expect(effects).toEqual([])
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
      expect(effects).toEqual([])
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
      expect(effects).toEqual(['sync'])
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
          ['sync'],
        ],
        [
          {
            discardRequired: true,
            blocksToProcess: new ContinuousBlocks([blocks.b2, blocks.b3]),
          },
          [],
        ],
        [
          {
            blocksProcessing: [],
          },
          ['discardAfter'],
        ],
        [
          {
            discardRequired: false,
            blocksProcessing: [blocks.b2, blocks.b3],
            blocksToProcess: new ContinuousBlocks(),
          },
          ['sync'],
        ],
        [
          {
            blocksProcessing: [],
            isProcessing: false,
          },
          [],
        ],
      ])
    })
  })

  it('syncs blocks', async () => {
    const lastBlockNumberSynced = 10000
    const syncStatusRepository = mock<SyncStatusRepository>({
      getLastBlockNumberSynced: async () => lastBlockNumberSynced,
      setLastBlockNumberSynced: async () => {},
    })
    let init!: (blocks: BlockRecord[]) => void
    let emitNewBlocks!: (blocks: BlockRecord[]) => void
    const blockDownloader = mock<BlockDownloader>({
      onInit: async (_from, handler) => {
        init = handler
      },
      onNewBlocks: (handler) => {
        emitNewBlocks = handler
        return () => {}
      },
      onReorg: () => () => {},
    })

    let emitSyncFinished!: () => void
    const dataSyncService = mock<DataSyncService>({
      sync: () => new Promise((resolve) => (emitSyncFinished = resolve)),
      discardAfter: async () => {},
    })

    const syncScheduler = new SyncScheduler(
      syncStatusRepository,
      blockDownloader,
      dataSyncService,
      new Logger({ logLevel: LogLevel.ERROR, format: 'pretty' })
    )

    await syncScheduler.start()

    expect(
      syncStatusRepository.getLastBlockNumberSynced
    ).toHaveBeenCalledExactlyWith([[]])

    expect(blockDownloader.onInit).toHaveBeenCalledExactlyWith([
      [lastBlockNumberSynced, expect.a<any>(Function)],
    ])
    expect(blockDownloader.onNewBlocks).toHaveBeenCalledExactlyWith([
      [expect.a<any>(Function)],
    ])
    expect(blockDownloader.onReorg).toHaveBeenCalledExactlyWith([
      [expect.a<any>(Function)],
    ])

    expect(dataSyncService.discardAfter).toHaveBeenCalledExactlyWith([
      [lastBlockNumberSynced],
    ])
    expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([])

    const blocks = [
      fakeBlock(lastBlockNumberSynced + 1),
      fakeBlock(lastBlockNumberSynced + 2),
      fakeBlock(lastBlockNumberSynced + 3),
      fakeBlock(lastBlockNumberSynced + 4),
    ]

    init!([blocks[0], blocks[1]])
    emitNewBlocks([blocks[2], blocks[3]])

    await waitForExpect(() => {
      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [new BlockRange([blocks[0], blocks[1]])],
      ])
      expect(
        syncStatusRepository.setLastBlockNumberSynced
      ).toHaveBeenCalledExactlyWith([[blocks[1].number]])
    })

    emitSyncFinished()

    await waitForExpect(() => {
      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [new BlockRange([blocks[0], blocks[1]])],
        [new BlockRange([blocks[2], blocks[3]])],
      ])
    })
  })

  it('handles sync failure and discards', async () => {
    const lastBlockNumberSynced = 10000
    const syncStatusRepository = mock<SyncStatusRepository>({
      getLastBlockNumberSynced: async () => lastBlockNumberSynced,
      setLastBlockNumberSynced: async () => {},
    })
    let init!: (blocks: BlockRecord[]) => void
    let emitNewBlocks!: (blocks: BlockRecord[]) => void
    let emitReorg!: (blocks: BlockRecord[]) => void
    const blockDownloader = mock<BlockDownloader>({
      onInit: async (_from, handler) => {
        init = handler
      },
      onNewBlocks: (handler) => {
        emitNewBlocks = handler
        return () => {}
      },
      onReorg: (handler) => {
        emitReorg = handler
        return () => {}
      },
    })

    let emitSyncFinished!: () => void
    let emitSyncFailed!: () => void

    const dataSyncService = mock<DataSyncService>({
      sync: () =>
        new Promise((resolve, reject) => {
          emitSyncFinished = resolve
          emitSyncFailed = () => reject(new Error('expected sync failure'))
        }),
      discardAfter: async () => {},
    })

    function prepareDiscardSpy() {
      let _discardFailed = false
      dataSyncService.discardAfter.executes(async () => {
        if (_discardFailed) return
        else {
          _discardFailed = true
          throw new Error('expected discard failure')
        }
      })
    }

    const syncScheduler = new SyncScheduler(
      syncStatusRepository,
      blockDownloader,
      dataSyncService,
      Logger.SILENT
    )

    await syncScheduler.start()

    expect(
      syncStatusRepository.getLastBlockNumberSynced
    ).toHaveBeenCalledExactlyWith([[]])

    expect(blockDownloader.onInit).toHaveBeenCalledExactlyWith([
      [lastBlockNumberSynced, expect.a<any>(Function)],
    ])
    expect(blockDownloader.onNewBlocks).toHaveBeenCalledExactlyWith([
      [expect.a<any>(Function)],
    ])
    expect(blockDownloader.onReorg).toHaveBeenCalledExactlyWith([
      [expect.a<any>(Function)],
    ])

    expect(dataSyncService.discardAfter).toHaveBeenCalledExactlyWith([
      [lastBlockNumberSynced],
    ])
    expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([])

    const blocks = {
      a1: fakeBlock(lastBlockNumberSynced + 1),
      a2: fakeBlock(lastBlockNumberSynced + 2),
      a3: fakeBlock(lastBlockNumberSynced + 3),
      a4: fakeBlock(lastBlockNumberSynced + 4),
      b3: fakeBlock(lastBlockNumberSynced + 3),
      b4: fakeBlock(lastBlockNumberSynced + 4),
    }

    init!([blocks.a1, blocks.a2])
    emitNewBlocks([blocks.a3, blocks.a4])

    await waitForExpect(() => {
      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [new BlockRange([blocks.a1, blocks.a2])],
      ])
      expect(
        syncStatusRepository.setLastBlockNumberSynced
      ).toHaveBeenCalledExactlyWith([[blocks.a2.number]])
    })

    const logError = mockFn<{ (error: unknown): void }>(() => {})
    ;(syncScheduler as any).logger.error = logError

    emitSyncFailed()

    await waitForExpect(() => {
      expect(logError).toHaveBeenCalledExactlyWith([
        [new Error('expected sync failure')],
      ])
      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [new BlockRange([blocks.a1, blocks.a2])], // <- failed
        [new BlockRange([blocks.a1, blocks.a2, blocks.a3, blocks.a4])],
      ])
    })

    emitSyncFinished()

    prepareDiscardSpy()
    emitReorg([blocks.b3, blocks.b4])

    await waitForExpect(() => {
      expect(dataSyncService.discardAfter).toHaveBeenCalledWith([
        blocks.b3.number - 1,
      ])
    })

    await waitForExpect(() => {
      expect(dataSyncService.discardAfter).toHaveBeenCalledExactlyWith([
        [lastBlockNumberSynced],
        [blocks.b3.number - 1], // <- failed
        [blocks.b3.number - 1],
      ])
    })
  })
})

function reduceAndConcat(
  actions: SyncSchedulerAction[],
  initialState = INITIAL_SYNC_STATE
) {
  const results = actions.reduce<
    Array<[state: SyncState, effects: SyncSchedulerEffect[]]>
  >(
    (acc, action) => {
      const prevState = acc[acc.length - 1][0]
      return [...acc, syncSchedulerReducer(prevState, action)]
    },
    [[initialState, []]]
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
