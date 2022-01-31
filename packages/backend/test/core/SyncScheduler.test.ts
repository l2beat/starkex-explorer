import { expect, mockFn } from 'earljs'
import { range } from 'lodash'
import waitForExpect from 'wait-for-expect'

import {
  BlockDownloader,
  BlockDownloaderEvents,
} from '../../src/core/BlockDownloader'
import { DataSyncService } from '../../src/core/DataSyncService'
import { SyncScheduler } from '../../src/core/SyncScheduler'
import { BlockRange, Hash256 } from '../../src/model'
import { BlockRepository } from '../../src/peripherals/database/BlockRepository'
import { SyncStatusRepository } from '../../src/peripherals/database/SyncStatusRepository'
import { createEventEmitter } from '../../src/tools/EventEmitter'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

describe(SyncScheduler.name, () => {
  it('syncs in batches', async () => {
    const lastBlockNumberSynced = 1
    const {
      statusRepository,
      blockRepository,
      blockDownloader,
      dataSyncService,
      emitNewBlocks,
    } = setupMocks({ lastBlockNumberSynced })

    const batchSize = 3
    const syncScheduler = new SyncScheduler(
      statusRepository,
      blockRepository,
      blockDownloader,
      dataSyncService,
      Logger.SILENT,
      batchSize
    )

    await syncScheduler.start()

    expect(dataSyncService.discardAfter).toHaveBeenCalledWith([1])

    emitNewBlocks(BlockRange.fake({ from: 2, to: 10 }))

    await waitForExpect(() => {
      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [expect.objectWith({ from: 2, to: 4 })],
        [expect.objectWith({ from: 5, to: 7 })],
        [expect.objectWith({ from: 8, to: 10 })],
      ])
    })
  })

  it('handles incoming new blocks', async () => {
    const {
      statusRepository,
      blockRepository,
      blockDownloader,
      dataSyncService,
      emitNewBlocks,
    } = setupMocks()

    const batchSize = 50
    const syncScheduler = new SyncScheduler(
      statusRepository,
      blockRepository,
      blockDownloader,
      dataSyncService,
      Logger.SILENT,
      batchSize
    )

    await syncScheduler.start()
    expect(dataSyncService.discardAfter).toHaveBeenCalledWith([0])

    emitNewBlocks(BlockRange.fake({ from: 1, to: 1 }))
    emitNewBlocks(BlockRange.fake({ from: 2, to: 2 }))
    emitNewBlocks(BlockRange.fake({ from: 3, to: 100 }))

    await waitForExpect(() => {
      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [expect.objectWith({ from: 1, to: 1 })],
        [expect.objectWith({ from: 2, to: 2 })],
        [expect.objectWith({ from: 3, to: 52 })],
        [expect.objectWith({ from: 53, to: 100 })],
      ])
    })
  })

  it('reruns failing syncs', async () => {
    const mocks = setupMocks({ lastBlockNumberSynced: 1 })

    let failed = false
    const _sync = mocks.dataSyncService.sync
    mocks.dataSyncService.sync = mockFn<DataSyncService['sync']>(
      async (...args) => {
        _sync(...args)
        if (!failed) {
          failed = true
          throw new Error('failed as expected')
        }
      }
    )

    const syncScheduler = new SyncScheduler(
      mocks.statusRepository,
      mocks.blockRepository,
      mocks.blockDownloader,
      mocks.dataSyncService,
      Logger.SILENT,
      6_000
    )

    await syncScheduler.start()

    const range = new BlockRange([{ number: 2, hash: Hash256.from(2n) }])
    mocks.emitNewBlocks(range)

    await waitForExpect(() => {
      expect(mocks.dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [range],
        [range],
      ])
    })
  })

  it('schedules discard on reorg', async () => {
    const lastBlockNumberSynced = 1
    const {
      statusRepository,
      blockRepository,
      blockDownloader,
      dataSyncService,
      emitReorg,
    } = setupMocks({ lastBlockNumberSynced })

    const batchSize = 100
    const syncScheduler = new SyncScheduler(
      statusRepository,
      blockRepository,
      blockDownloader,
      dataSyncService,
      Logger.SILENT,
      batchSize
    )

    await syncScheduler.start()

    emitReorg({ firstChangedBlock: 10 })

    waitForExpect(() => {
      expect(dataSyncService.discardAfter).toHaveBeenCalledWith([10])
    })
  })

  it('syncs range between last synced and last known block on startup', async () => {
    const lastBlockNumberSynced = 12345
    const {
      statusRepository,
      blockRepository,
      blockDownloader,
      dataSyncService,
    } = setupMocks({ lastBlockNumberSynced })

    const batchSize = 10_000
    const syncScheduler = new SyncScheduler(
      statusRepository,
      blockRepository,
      blockDownloader,
      dataSyncService,
      Logger.SILENT,
      batchSize
    )

    const lastKnown = lastBlockNumberSynced + batchSize
    blockDownloader.getLastKnownBlock.returnsOnce({
      number: lastKnown,
      hash: Hash256.from(BigInt(lastKnown)),
    })

    await syncScheduler.start()

    await waitForExpect(() => {
      expect(blockDownloader.getLastKnownBlock).toHaveBeenCalledExactlyWith([
        [],
      ])

      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [
          BlockRange.fake({
            from: lastBlockNumberSynced + 1,
            to: lastBlockNumberSynced + batchSize,
          }),
        ],
      ])
    })
  })
})

function setupMocks({
  lastBlockNumberSynced = undefined,
}: {
  lastBlockNumberSynced?: number
} = {}) {
  let lastSynced = lastBlockNumberSynced || 0
  const lastKnown = lastSynced

  const statusRepository = mock<SyncStatusRepository>({
    getLastBlockNumberSynced: async () => lastSynced,
    setLastBlockNumberSynced: async (value) => void (lastSynced = value),
  })

  const blockDownloaderEvents = createEventEmitter<BlockDownloaderEvents>()

  const _blockDownloaderProperties = { events: blockDownloaderEvents }
  const blockDownloader = mock<BlockDownloader>({
    ...{ events: blockDownloaderEvents },
    getLastKnownBlock: () => ({
      number: lastKnown,
      hash: Hash256.from(BigInt(lastKnown)),
    }),
    onNewBlocks: BlockDownloader.prototype.onNewBlocks.bind(
      _blockDownloaderProperties
    ),
    onReorg: BlockDownloader.prototype.onReorg.bind(_blockDownloaderProperties),
  })

  const blockRepository = mock<BlockRepository>({
    getAllInRange: async (from, to) =>
      range(from, to + 1).map((i) => ({
        hash: Hash256.from(BigInt(i)),
        number: i,
      })),
  })

  return {
    statusRepository,
    blockRepository,
    blockDownloader,
    dataSyncService: mock<DataSyncService>({
      sync: mockFn().resolvesTo(undefined),
      discardAfter: mockFn().resolvesTo(undefined),
    }),
    emitNewBlocks: (event: BlockRange) =>
      blockDownloaderEvents.emit('newBlocks', event),
    emitReorg: (event: { firstChangedBlock: number }) =>
      blockDownloaderEvents.emit('reorg', event),
  }
}
