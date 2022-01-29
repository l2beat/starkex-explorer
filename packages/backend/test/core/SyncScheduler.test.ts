import { expect, mockFn } from 'earljs'
import waitForExpect from 'wait-for-expect'

import { BlockDownloader } from '../../src/core/BlockDownloader'
import { DataSyncService } from '../../src/core/DataSyncService'
import { SyncScheduler } from '../../src/core/SyncScheduler'
import { BlockRange, Hash256 } from '../../src/model'
import { SyncStatusRepository } from '../../src/peripherals/database/SyncStatusRepository'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

describe.only(SyncScheduler.name, () => {
  it('syncs in batches', async () => {
    const lastBlockNumberSynced = 1
    const {
      statusRepository,
      blockDownloader: safeBlockService,
      dataSyncService,
      newBlocksListener,
    } = setupMocks({ lastBlockNumberSynced })

    const batchSize = 3
    const syncScheduler = new SyncScheduler(
      statusRepository,
      safeBlockService,
      dataSyncService,
      Logger.SILENT,
      batchSize
    )

    await syncScheduler.start()

    expect(dataSyncService.discard).toHaveBeenCalledWith([{ from: 0 }])

    newBlocksListener({ from: 2, to: 10 } as BlockRange)

    await waitForExpect(() => {
      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [{ from: 2, to: 4 }],
        [{ from: 5, to: 7 }],
        [{ from: 8, to: 10 }],
      ])
    })
  })

  it('handles incoming new blocks', async () => {
    const {
      statusRepository,
      blockDownloader: safeBlockService,
      dataSyncService,
      newBlocksListener,
    } = setupMocks()

    const batchSize = 50
    const syncScheduler = new SyncScheduler(
      statusRepository,
      safeBlockService,
      dataSyncService,
      Logger.SILENT,
      batchSize
    )

    await syncScheduler.start()
    expect(dataSyncService.discard).toHaveBeenCalledWith([{ from: 0 }])

    newBlocksListener({ from: 8, to: 8 } as BlockRange)
    newBlocksListener({ from: 9, to: 9 } as BlockRange)
    newBlocksListener({ from: 10, to: 100 } as BlockRange)

    await waitForExpect(() => {
      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [{ from: 1, to: 8 }],
        [{ from: 9, to: 9 }],
        [{ from: 10, to: 59 }],
        [{ from: 60, to: 100 }],
      ])
    })
  })

  it.only('reruns failing syncs', async () => {
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
      mocks.blockDownloader,
      mocks.dataSyncService,
      Logger.SILENT,
      6_000
    )

    await syncScheduler.start()

    const range = new BlockRange([{ number: 2, hash: '0x2' }])
    mocks.newBlocksListener(range)

    await waitForExpect(() => {
      expect(mocks.dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [range],
        [range],
      ])
    })
  })
})

function setupMocks({
  lastBlockNumberSynced = undefined,
}: {
  lastBlockNumberSynced?: number
} = {}) {
  let storedValue: number = lastBlockNumberSynced || 0
  const statusRepository = mock<SyncStatusRepository>({
    getLastBlockNumberSynced: async () => storedValue,
    setLastBlockNumberSynced: async (value) => void (storedValue = value),
  })

  let newBlocksListener:
    | Parameters<BlockDownloader['onNewBlocks']>[0]
    | undefined
  let reorgListener: Parameters<BlockDownloader['onReorg']>[0] | undefined

  const blockDownloader = mock<BlockDownloader>({
    getLastKnownBlock: () => ({
      number: 123,
      hash: '0x123',
      rangeFrom: mockFn<(_: number) => Promise<BlockRange>>(),
    }),
    onNewBlocks: (listener) => {
      newBlocksListener = listener
      return () => (newBlocksListener = undefined)
    },
    onReorg: (listener) => {
      reorgListener = listener
      return () => (reorgListener = undefined)
    },
  })

  return {
    statusRepository,
    blockDownloader,
    dataSyncService: mock<DataSyncService>({
      sync: mockFn().resolvesTo(undefined),
      discard: mockFn().resolvesTo(undefined),
    }),
    newBlocksListener: (
      ...args: Parameters<Exclude<typeof newBlocksListener, undefined>>
    ) => newBlocksListener!(...args),
  }
}
