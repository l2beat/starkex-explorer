import { Hash256 } from '@explorer/types'
import { expect, mockFn } from 'earljs'
import waitForExpect from 'wait-for-expect'

import { PerpetualRollupSyncService } from '../../../src/core/PerpetualRollupSyncService'
import { BlockDownloader } from '../../../src/core/sync/BlockDownloader'
import { SyncScheduler } from '../../../src/core/sync/SyncScheduler'
import { Block } from '../../../src/core/sync/syncSchedulerReducer'
import { BlockRange } from '../../../src/model'
import { SyncStatusRepository } from '../../../src/peripherals/database/SyncStatusRepository'
import { Logger } from '../../../src/tools/Logger'
import { mock } from '../../mock'

describe(SyncScheduler.name, () => {
  const block = (number: number): Block => ({
    number,
    hash: Hash256.fake(number.toString()),
  })

  describe(SyncScheduler.prototype.start.name, () => {
    it('starts from scratch', async () => {
      const syncStatusRepository = mock<SyncStatusRepository>({
        getLastSynced: async () => undefined,
      })
      const blockDownloader = mock<BlockDownloader>({
        getKnownBlocks: async () => [],
        onNewBlock: () => () => {},
        onReorg: () => () => {},
      })
      const dataSyncService = mock<PerpetualRollupSyncService>({
        discardAfter: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        syncStatusRepository,
        blockDownloader,
        dataSyncService,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )

      await syncScheduler.start()

      expect(dataSyncService.discardAfter).toHaveBeenCalledWith([1_000_000])
      expect(blockDownloader.getKnownBlocks).toHaveBeenCalledWith([1_000_000])
      expect(blockDownloader.onNewBlock.calls.length).toEqual(1)
      expect(blockDownloader.onReorg.calls.length).toEqual(1)
    })

    it('starts from the middle', async () => {
      const syncStatusRepository = mock<SyncStatusRepository>({
        getLastSynced: async () => 2_000_000,
      })
      const blockDownloader = mock<BlockDownloader>({
        getKnownBlocks: async () => [block(2_000_100), block(2_000_101)],
        onNewBlock: () => () => {},
        onReorg: () => () => {},
      })
      const dataSyncService = mock<PerpetualRollupSyncService>({
        discardAfter: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        syncStatusRepository,
        blockDownloader,
        dataSyncService,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )

      const dispatch = mockFn().returns(undefined)
      syncScheduler.dispatch = dispatch
      await syncScheduler.start()

      expect(dataSyncService.discardAfter).toHaveBeenCalledWith([2_000_000])
      expect(blockDownloader.getKnownBlocks).toHaveBeenCalledWith([2_000_000])
      expect(blockDownloader.onNewBlock.calls.length).toEqual(1)
      expect(blockDownloader.onReorg.calls.length).toEqual(1)
      expect(dispatch).toHaveBeenCalledWith([
        {
          type: 'initialized',
          lastSynced: 2_000_000,
          knownBlocks: [block(2_000_100), block(2_000_101)],
        },
      ])
    })
  })

  describe(SyncScheduler.prototype.dispatch.name, () => {
    it('handles a successful sync', async () => {
      const syncStatusRepository = mock<SyncStatusRepository>({
        setLastSynced: async () => {},
      })
      const blockDownloader = mock<BlockDownloader>()
      const dataSyncService = mock<PerpetualRollupSyncService>({
        sync: async () => {},
        discardAfter: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        syncStatusRepository,
        blockDownloader,
        dataSyncService,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )

      syncScheduler.dispatch({
        type: 'initialized',
        lastSynced: 1_000_000,
        knownBlocks: [block(1_000_001), block(1_000_002)],
      })

      await waitForExpect(() => {
        expect(dataSyncService.discardAfter).toHaveBeenCalledWith([1_000_000])
        expect(dataSyncService.sync).toHaveBeenCalledWith([
          new BlockRange([block(1_000_001), block(1_000_002)]),
        ])
        expect(syncStatusRepository.setLastSynced).toHaveBeenCalledWith([
          1_000_002,
        ])
      })
    })

    it('handles a failing sync', async () => {
      const syncStatusRepository = mock<SyncStatusRepository>({
        setLastSynced: async () => {},
      })
      const blockDownloader = mock<BlockDownloader>()
      const dataSyncService = mock<PerpetualRollupSyncService>({
        sync: mockFn().rejectsWith(new Error('oops')),
        discardAfter: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        syncStatusRepository,
        blockDownloader,
        dataSyncService,
        Logger.SILENT,
        { earliestBlock: 1_000_000 }
      )

      syncScheduler.dispatch({
        type: 'initialized',
        lastSynced: 1_000_000,
        knownBlocks: [block(1_000_001), block(1_000_002)],
      })

      await waitForExpect(() => {
        expect(dataSyncService.sync).toHaveBeenCalledWith([
          new BlockRange([block(1_000_001), block(1_000_002)]),
        ])
        expect(syncStatusRepository.setLastSynced).not.toHaveBeenCalledWith([
          1_000_002,
        ])
      })

      // allow the jobQueue to finish
      dataSyncService.sync.resolvesTo(undefined)
    })

    it('handles a successful discardAfter', async () => {
      const syncStatusRepository = mock<SyncStatusRepository>({
        setLastSynced: async () => {},
      })
      const blockDownloader = mock<BlockDownloader>()
      const dataSyncService = mock<PerpetualRollupSyncService>({
        sync: async () => {},
        discardAfter: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        syncStatusRepository,
        blockDownloader,
        dataSyncService,
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
        expect(dataSyncService.discardAfter).toHaveBeenCalledExactlyWith([
          [999_999], // this from handleDiscard
          [999_999], // this from later handleSync
        ])
        expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
          [new BlockRange([block(1_000_000), block(1_000_001)])],
        ])
        expect(syncStatusRepository.setLastSynced).toHaveBeenCalledExactlyWith([
          [999_999],
          [1_000_001],
        ])
      })
    })

    it('handles a failing discardAfter', async () => {
      const syncStatusRepository = mock<SyncStatusRepository>({
        setLastSynced: async () => {},
      })
      const blockDownloader = mock<BlockDownloader>()
      const dataSyncService = mock<PerpetualRollupSyncService>({
        sync: async () => {},
        discardAfter: mockFn().rejectsWith(new Error('oops')),
      })
      const syncScheduler = new SyncScheduler(
        syncStatusRepository,
        blockDownloader,
        dataSyncService,
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
        expect(syncStatusRepository.setLastSynced).toHaveBeenCalledWith([
          999_999,
        ])
        expect(dataSyncService.discardAfter).toHaveBeenCalledWith([999_999])
      })

      // allow the jobQueue to finish
      dataSyncService.discardAfter.resolvesTo(undefined)
    })
  })

  describe(SyncScheduler.prototype.handleSync.name, () => {
    it('triggers data sync only if block range is inside the limit', async () => {
      const maxBlockNumber = 10
      const dataSyncService = mock<PerpetualRollupSyncService>({
        discardAfter: async () => {},
        sync: async () => {},
      })
      const syncStatusRepository = mock<SyncStatusRepository>({
        setLastSynced: async () => {},
      })
      const syncScheduler = new SyncScheduler(
        syncStatusRepository,
        mock<BlockDownloader>(),
        dataSyncService,
        Logger.SILENT,
        { earliestBlock: 1, maxBlockNumber }
      )

      await syncScheduler.handleSync(
        new BlockRange([block(maxBlockNumber - 2), block(maxBlockNumber - 1)])
      )

      await waitForExpect(() => {
        expect(dataSyncService.discardAfter.calls.length).toEqual(1)
        expect(dataSyncService.sync.calls.length).toEqual(1)
        expect(syncStatusRepository.setLastSynced.calls.length).toEqual(1)
      })

      await syncScheduler.handleSync(
        new BlockRange([block(maxBlockNumber), block(maxBlockNumber + 1)])
      )

      await waitForExpect(() => {
        expect(dataSyncService.discardAfter.calls.length).toEqual(1)
        expect(dataSyncService.sync.calls.length).toEqual(1)
        expect(syncStatusRepository.setLastSynced.calls.length).toEqual(1)
      })
    })
  })
})
