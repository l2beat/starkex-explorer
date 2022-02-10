import { expect, mockFn } from 'earljs'
import waitForExpect from 'wait-for-expect'

import { DataSyncService } from '../../../src/core/DataSyncService'
import { BlockDownloader } from '../../../src/core/sync/BlockDownloader'
import { Block } from '../../../src/core/sync/ContinuousBlocks'
import { SyncScheduler } from '../../../src/core/sync/SyncScheduler'
import { BlockRange, Hash256 } from '../../../src/model'
import { BlockRecord } from '../../../src/peripherals/database/BlockRepository'
import { SyncStatusRepository } from '../../../src/peripherals/database/SyncStatusRepository'
import { Logger, LogLevel } from '../../../src/tools/Logger'
import { mock } from '../../mock'

describe(SyncScheduler.name, () => {
  it('syncs blocks', async () => {
    const lastBlockNumberSynced = 10000
    const blocks = [
      fakeBlock(lastBlockNumberSynced + 1),
      fakeBlock(lastBlockNumberSynced + 2),
      fakeBlock(lastBlockNumberSynced + 3),
      fakeBlock(lastBlockNumberSynced + 4),
    ]
    const syncStatusRepository = mock<SyncStatusRepository>({
      getLastBlockNumberSynced: async () => lastBlockNumberSynced,
      setLastBlockNumberSynced: async () => {},
    })
    let emitNewBlock!: (blocks: BlockRecord) => void
    const blockDownloader = mock<BlockDownloader>({
      getKnownBlocks: async () => [blocks[0], blocks[1]],
      onNewBlock: (handler) => {
        emitNewBlock = handler
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

    expect(blockDownloader.getKnownBlocks).toHaveBeenCalledExactlyWith([
      [lastBlockNumberSynced],
    ])
    expect(blockDownloader.onNewBlock).toHaveBeenCalledExactlyWith([
      [expect.a<any>(Function)],
    ])
    expect(blockDownloader.onReorg).toHaveBeenCalledExactlyWith([
      [expect.a<any>(Function)],
    ])

    expect(dataSyncService.discardAfter).toHaveBeenCalledExactlyWith([
      [lastBlockNumberSynced],
    ])
    expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([])

    emitNewBlock(blocks[2])
    emitNewBlock(blocks[3])

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
    const blocks = {
      a1: fakeBlock(lastBlockNumberSynced + 1),
      a2: fakeBlock(lastBlockNumberSynced + 2),
      a3: fakeBlock(lastBlockNumberSynced + 3),
      a4: fakeBlock(lastBlockNumberSynced + 4),
      b3: fakeBlock(lastBlockNumberSynced + 3),
      b4: fakeBlock(lastBlockNumberSynced + 4),
    }
    const syncStatusRepository = mock<SyncStatusRepository>({
      getLastBlockNumberSynced: async () => lastBlockNumberSynced,
      setLastBlockNumberSynced: async () => {},
    })
    let emitNewBlock!: (blocks: BlockRecord) => void
    let emitReorg!: (blocks: BlockRecord[]) => void
    const blockDownloader = mock<BlockDownloader>({
      getKnownBlocks: async () => [blocks.a1, blocks.a2],
      onNewBlock: (handler) => {
        emitNewBlock = handler
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

    expect(blockDownloader.getKnownBlocks).toHaveBeenCalledExactlyWith([
      [lastBlockNumberSynced],
    ])
    expect(blockDownloader.onNewBlock).toHaveBeenCalledExactlyWith([
      [expect.a<any>(Function)],
    ])
    expect(blockDownloader.onReorg).toHaveBeenCalledExactlyWith([
      [expect.a<any>(Function)],
    ])

    expect(dataSyncService.discardAfter).toHaveBeenCalledExactlyWith([
      [lastBlockNumberSynced],
    ])
    expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([])

    emitNewBlock(blocks.a3)
    emitNewBlock(blocks.a4)

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

function fakeBlock(number: number): Block {
  return {
    number,
    hash: Hash256.fake(),
  }
}
