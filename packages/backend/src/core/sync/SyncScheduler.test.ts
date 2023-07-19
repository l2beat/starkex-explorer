import { AssetId, Hash256 } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect, mockFn, mockObject } from 'earl'
import waitForExpect from 'wait-for-expect'

import { BlockRange } from '../../model'
import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { PerpetualRollupSyncService } from '../PerpetualRollupSyncService'
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
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn().resolvesTo('lastBlockNumberSynced'),
      })
      const blockDownloader = mockObject<BlockDownloader>()
      const dataSyncService = mockObject<PerpetualRollupSyncService>({
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

      syncScheduler.dispatch({
        type: 'initialized',
        lastSynced: 1_000_000,
        knownBlocks: [block(1_000_001), block(1_000_002)],
      })

      await waitForExpect(() => {
        expect(dataSyncService.discardAfter).toHaveBeenOnlyCalledWith(1_000_000)
        expect(dataSyncService.sync).toHaveBeenOnlyCalledWith(
          new BlockRange([block(1_000_001), block(1_000_002)])
        )
        expect(mockKeyValueStore.addOrUpdate).toHaveBeenOnlyCalledWith({
          key: 'lastBlockNumberSynced',
          value: 1_000_002,
        })
        expect(preprocessor.sync).toHaveBeenCalled()
      })
    })

    it('handles a failing sync', async () => {
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn().resolvesTo('lastBlockNumberSynced'),
      })
      const blockDownloader = mockObject<BlockDownloader>()
      const dataSyncService = mockObject<PerpetualRollupSyncService>({
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

      syncScheduler.dispatch({
        type: 'initialized',
        lastSynced: 1_000_000,
        knownBlocks: [block(1_000_001), block(1_000_002)],
      })

      await waitForExpect(() => {
        expect(dataSyncService.sync).toHaveBeenOnlyCalledWith(
          new BlockRange([block(1_000_001), block(1_000_002)])
        )
        expect(mockKeyValueStore.addOrUpdate).not.toHaveBeenCalled()
      })

      // allow the jobQueue to finish
      dataSyncService.sync.resolvesTo(undefined)
    })

    it('handles a successful discardAfter', async () => {
      const mockKeyValueStore = mockObject<KeyValueStore>({
        addOrUpdate: mockFn().resolvesTo('lastBlockNumberSynced'),
      })
      const blockDownloader = mockObject<BlockDownloader>()
      const dataSyncService = mockObject<PerpetualRollupSyncService>({
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

        expect(dataSyncService.sync).toHaveBeenOnlyCalledWith(
          new BlockRange([block(1_000_000), block(1_000_001)])
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
    it('triggers data sync only if block range is inside the limit', async () => {
      const maxBlockNumber = 10
      const dataSyncService = mockObject<PerpetualRollupSyncService>({
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

      await syncScheduler.handleSync(
        new BlockRange([block(maxBlockNumber - 2), block(maxBlockNumber - 1)])
      )

      await waitForExpect(() => {
        expect(dataSyncService.discardAfter).toHaveBeenCalledTimes(1)
        expect(dataSyncService.sync).toHaveBeenCalledTimes(1)
        expect(mockKeyValueStore.addOrUpdate).toHaveBeenCalledTimes(1)
        expect(preprocessor.sync).toHaveBeenCalled()
      })

      await syncScheduler.handleSync(
        new BlockRange([block(maxBlockNumber), block(maxBlockNumber + 1)])
      )

      await waitForExpect(() => {
        expect(dataSyncService.discardAfter).toHaveBeenCalledTimes(1)
        expect(dataSyncService.sync).toHaveBeenCalledTimes(1)
        expect(mockKeyValueStore.addOrUpdate).toHaveBeenCalledTimes(1)
        expect(preprocessor.sync).toHaveBeenCalled()
      })
    })
  })
})
