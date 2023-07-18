import { AssetId, Hash256 } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import waitForExpect from 'wait-for-expect'

import { BlockRange } from '../../model'
import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { Logger } from '../../tools/Logger'
import { PerpetualRollupSyncService } from '../PerpetualRollupSyncService'
import { PerpetualValidiumSyncService } from '../PerpetualValidiumSyncService'
import { Preprocessor } from '../preprocessing/Preprocessor'
import { BlockDownloader } from './BlockDownloader'
import { SyncScheduler } from './SyncScheduler'
import { Block } from './syncSchedulerReducer'

describe(SyncScheduler.name, () => {
  const block = (number: number): Block => ({
    number,
    hash: Hash256.fake(number.toString()),
  })

  describe(SyncScheduler.prototype.start.name, () => {
    it('starts from scratch', async () => {
      const mockKeyValueStore = mockObject<KeyValueStore>({
        findByKey: async () => undefined,
      })
      const blockDownloader = mockObject<BlockDownloader>({
        getKnownBlocks: async () => [],
        onNewBlock: () => () => {},
        onReorg: () => () => {},
      })
      const dataSyncService = mockObject<PerpetualRollupSyncService>({
        discardAfter: async () => {},
      })
      const preprocessor = mockObject<Preprocessor<AssetId>>({
        sync: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        mockKeyValueStore,
        blockDownloader,
        dataSyncService,
        preprocessor,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )

      await syncScheduler.start()

      expect(dataSyncService.discardAfter).toHaveBeenOnlyCalledWith(1_000_000)
      expect(blockDownloader.getKnownBlocks).toHaveBeenOnlyCalledWith(1_000_000)
      expect(blockDownloader.onNewBlock).toHaveBeenCalledTimes(1)
      expect(blockDownloader.onReorg).toHaveBeenCalledTimes(1)
      expect(preprocessor.sync).toHaveBeenCalled()
    })

    it('starts from the middle', async () => {
      const mockKeyValueStore = mockObject<KeyValueStore>({
        findByKey: mockFn().resolvesTo(2_000_000),
      })
      const blockDownloader = mockObject<BlockDownloader>({
        getKnownBlocks: async () => [block(2_000_100), block(2_000_101)],
        onNewBlock: () => () => {},
        onReorg: () => () => {},
      })
      const dataSyncService = mockObject<PerpetualRollupSyncService>({
        discardAfter: async () => {},
      })
      const preprocessor = mockObject<Preprocessor<AssetId>>({
        sync: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        mockKeyValueStore,
        blockDownloader,
        dataSyncService,
        preprocessor,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )

      const dispatch = mockFn().returns(undefined)
      syncScheduler.dispatch = dispatch
      await syncScheduler.start()

      expect(dataSyncService.discardAfter).toHaveBeenOnlyCalledWith(2_000_000)
      expect(blockDownloader.getKnownBlocks).toHaveBeenOnlyCalledWith(2_000_000)
      expect(blockDownloader.onNewBlock).toHaveBeenCalledTimes(1)
      expect(blockDownloader.onReorg).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenOnlyCalledWith({
        type: 'initialized',
        lastSynced: 2_000_000,
        knownBlocks: [block(2_000_100), block(2_000_101)],
      })
      expect(preprocessor.sync).toHaveBeenCalled()
    })
  })

  describe(SyncScheduler.prototype.dispatch.name, () => {
    it('handles a successful sync', async () => {
      const isTip = true
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn().resolvesTo('lastBlockNumberSynced'),
      })
      const blockDownloader = mockObject<BlockDownloader>()
      const dataSyncService = mockObject<PerpetualValidiumSyncService>({
        sync: async () => {},
        discardAfter: async () => {},
      })
      const preprocessor = mockObject<Preprocessor<AssetId>>({
        sync: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        mockKeyValueStore,
        blockDownloader,
        dataSyncService,
        preprocessor,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )
      const mockIsTipFn = mockFn().returns(isTip)
      syncScheduler.isTip = mockIsTipFn

      syncScheduler.dispatch({
        type: 'initialized',
        lastSynced: 1_000_000,
        knownBlocks: [block(1_000_001), block(1_000_002)],
      })

      await waitForExpect(() => {
        expect(mockIsTipFn).toHaveBeenOnlyCalledWith(1_000_003)
        expect(dataSyncService.discardAfter).toHaveBeenOnlyCalledWith(1_000_000)
        expect(dataSyncService.sync).toHaveBeenOnlyCalledWith(
          new BlockRange([block(1_000_001), block(1_000_002)]),
          isTip
        )
        expect(mockKeyValueStore.addOrUpdate).toHaveBeenOnlyCalledWith({
          key: 'lastBlockNumberSynced',
          value: 1_000_002,
        })
        expect(preprocessor.sync).toHaveBeenCalled()
      })
    })

    it('handles a failing sync', async () => {
      const isTip = false
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn().resolvesTo('lastBlockNumberSynced'),
      })
      const blockDownloader = mockObject<BlockDownloader>()
      const dataSyncService = mockObject<PerpetualValidiumSyncService>({
        sync: mockFn().rejectsWith(new Error('oops')),
        discardAfter: async () => {},
      })
      const preprocessor = mockObject<Preprocessor<AssetId>>({
        sync: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        mockKeyValueStore,
        blockDownloader,
        dataSyncService,
        preprocessor,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )
      const mockIsTipFn = mockFn().returns(isTip)
      syncScheduler.isTip = mockIsTipFn

      syncScheduler.dispatch({
        type: 'initialized',
        lastSynced: 1_000_000,
        knownBlocks: [block(1_000_001), block(1_000_002)],
      })

      await waitForExpect(() => {
        expect(mockIsTipFn).toHaveBeenOnlyCalledWith(1_000_003)
        expect(dataSyncService.sync).toHaveBeenOnlyCalledWith(
          new BlockRange([block(1_000_001), block(1_000_002)]),
          isTip
        )
        expect(mockKeyValueStore.addOrUpdate).not.toHaveBeenCalled()
      })

      // allow the jobQueue to finish
      dataSyncService.sync.resolvesTo(undefined)
    })

    it('handles a successful discardAfter', async () => {
      const isTip = true
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn().resolvesTo('lastBlockNumberSynced'),
      })
      const blockDownloader = mockObject<BlockDownloader>()
      const dataSyncService = mockObject<PerpetualValidiumSyncService>({
        sync: async () => {},
        discardAfter: async () => {},
      })
      const preprocessor = mockObject<Preprocessor<AssetId>>({
        sync: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        mockKeyValueStore,
        blockDownloader,
        dataSyncService,
        preprocessor,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )
      const mockIsTipFn = mockFn().returns(isTip)
      syncScheduler.isTip = mockIsTipFn

      syncScheduler.dispatch({
        type: 'initialized',
        lastSynced: 1_000_000,
        knownBlocks: [],
      })
      syncScheduler.dispatch({
        type: 'reorgOccurred',
        blocks: [block(1_000_000), block(1_000_001)],
      })

      await waitForExpect(() => {
        expect(dataSyncService.discardAfter).toHaveBeenCalledTimes(2)
        expect(dataSyncService.discardAfter).toHaveBeenNthCalledWith(1, 999_999)
        expect(dataSyncService.discardAfter).toHaveBeenNthCalledWith(2, 999_999)

        expect(mockIsTipFn).toHaveBeenOnlyCalledWith(1_000_002)
        expect(dataSyncService.sync).toHaveBeenOnlyCalledWith(
          new BlockRange([block(1_000_000), block(1_000_001)]),
          isTip
        )

        expect(mockKeyValueStore.addOrUpdate).toHaveBeenCalledTimes(2)
        expect(mockKeyValueStore.addOrUpdate).toHaveBeenNthCalledWith(1, {
          key: 'lastBlockNumberSynced',
          value: 999_999,
        })
        expect(mockKeyValueStore.addOrUpdate).toHaveBeenNthCalledWith(2, {
          key: 'lastBlockNumberSynced',
          value: 1_000_001,
        })

        expect(preprocessor.sync).toHaveBeenCalled()
      })
    })

    it('handles a failing discardAfter', async () => {
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn().resolvesTo('lastBlockNumberSynced'),
      })
      const blockDownloader = mockObject<BlockDownloader>()
      const dataSyncService = mockObject<PerpetualRollupSyncService>({
        sync: async () => {},
        discardAfter: mockFn().rejectsWith(new Error('oops')),
      })
      const preprocessor = mockObject<Preprocessor<AssetId>>({
        sync: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        mockKeyValueStore,
        blockDownloader,
        dataSyncService,
        preprocessor,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )

      syncScheduler.dispatch({
        type: 'initialized',
        lastSynced: 1_000_000,
        knownBlocks: [],
      })
      syncScheduler.dispatch({
        type: 'reorgOccurred',
        blocks: [block(1_000_000), block(1_000_001)],
      })

      await waitForExpect(() => {
        expect(mockKeyValueStore.addOrUpdate).toHaveBeenOnlyCalledWith({
          key: 'lastBlockNumberSynced',
          value: 999_999,
        })
        expect(dataSyncService.discardAfter).toHaveBeenOnlyCalledWith(999_999)
        expect(preprocessor.sync).toHaveBeenCalled()
      })

      // allow the jobQueue to finish
      dataSyncService.discardAfter.resolvesTo(undefined)
    })
  })

  describe(SyncScheduler.prototype.handleSync.name, () => {
    const maxBlockNumber = 10

    it('triggers data sync only if block range is inside the limit', async () => {
      const isTip = true
      const dataSyncService = mockObject<PerpetualValidiumSyncService>({
        discardAfter: async () => {},
        sync: async () => {},
      })
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn().resolvesTo('lastBlockNumberSynced'),
      })
      const preprocessor = mockObject<Preprocessor<AssetId>>({
        sync: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        mockKeyValueStore,
        mockObject<BlockDownloader>(),
        dataSyncService,
        preprocessor,
        Logger.SILENT,
        { earliestBlock: 1, maxBlockNumber }
      )
      const mockIsTipFn = mockFn().returns(isTip)
      syncScheduler.isTip = mockIsTipFn

      const blocks = new BlockRange([
        block(maxBlockNumber - 2),
        block(maxBlockNumber - 1),
      ])

      await syncScheduler.handleSync(blocks)

      await waitForExpect(() => {
        expect(mockIsTipFn).toHaveBeenOnlyCalledWith(blocks.end)
        expect(dataSyncService.discardAfter).toHaveBeenCalledTimes(1)
        expect(dataSyncService.sync).toHaveBeenOnlyCalledWith(
          expect.a(BlockRange),
          isTip
        )
        expect(mockKeyValueStore.addOrUpdate).toHaveBeenCalledTimes(1)
        expect(preprocessor.sync).toHaveBeenCalled()
      })
    })

    it('skips data sync if block range is outside the limit', async () => {
      const dataSyncService = mockObject<PerpetualValidiumSyncService>({
        discardAfter: mockFn(),
        sync: mockFn(),
      })
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn(),
      })
      const preprocessor = mockObject<Preprocessor<AssetId>>({
        sync: mockFn(),
      })

      const syncScheduler = new SyncScheduler(
        mockKeyValueStore,
        mockObject<BlockDownloader>(),
        dataSyncService,
        preprocessor,
        Logger.SILENT,
        { earliestBlock: 1, maxBlockNumber }
      )
      const mockIsTipFn = mockFn().returns(false)
      syncScheduler.isTip = mockIsTipFn

      const blocks = new BlockRange([
        block(maxBlockNumber),
        block(maxBlockNumber + 1),
      ])

      await syncScheduler.handleSync(blocks)

      await waitForExpect(() => {
        expect(mockIsTipFn).not.toHaveBeenCalled()
        expect(dataSyncService.discardAfter).not.toHaveBeenCalled()
        expect(dataSyncService.sync).not.toHaveBeenCalled()
        expect(mockKeyValueStore.addOrUpdate).not.toHaveBeenCalled()
        expect(preprocessor.sync).not.toHaveBeenCalled()
      })
    })
  })

  describe(SyncScheduler.prototype.isTip.name, () => {
    const syncScheduler = new SyncScheduler(
      mockObject<KeyValueStore>(),
      mockObject<BlockDownloader>(),
      mockObject<PerpetualValidiumSyncService>(),
      mockObject<Preprocessor<AssetId>>(),
      Logger.SILENT,
      { earliestBlock: 1, maxBlockNumber: 10 }
    )

    beforeEach(() => {
      syncScheduler.dispatch({
        type: 'initialized',
        lastSynced: 1_000_000,
        knownBlocks: [block(1_000_001), block(1_000_002)],
      })
    })

    it('returns false if the block range is not the tip', () => {
      expect(syncScheduler.isTip(1_000_001)).toEqual(false)
    })

    it('returns true if the block range is the tip', () => {
      expect(syncScheduler.isTip(1_000_003)).toEqual(true)
    })
  })
})
