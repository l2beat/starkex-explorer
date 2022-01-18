import { expect, mockFn } from 'earljs'
import waitForExpect from 'wait-for-expect'

import { DataSyncService } from '../../src/core/DataSyncService'
import { SafeBlock, SafeBlockService } from '../../src/core/SafeBlockService'
import { SyncScheduler } from '../../src/core/SyncScheduler'
import { SyncStatusRepository } from '../../src/peripherals/database/SyncStatusRepository'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

describe(SyncScheduler.name, () => {
  it('syncs in batches', async () => {
    const lastBlockNumberSynced = 1
    const {
      statusRepository,
      safeBlockService,
      dataSyncService,
      safeBlockListener,
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

    expect(dataSyncService.revert).toHaveBeenCalledWith([lastBlockNumberSynced])

    safeBlockListener({ blockNumber: 10, timestamp: 0 })

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
      safeBlockService,
      dataSyncService,
      safeBlockListener,
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
    expect(dataSyncService.revert).toHaveBeenCalledWith([0])

    safeBlockListener({ blockNumber: 8, timestamp: 0 })
    safeBlockListener({ blockNumber: 9, timestamp: 0 })
    safeBlockListener({ blockNumber: 100, timestamp: 0 })

    await waitForExpect(() => {
      expect(dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [{ from: 1, to: 8 }],
        [{ from: 9, to: 9 }],
        [{ from: 10, to: 59 }],
        [{ from: 60, to: 100 }],
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
      mocks.safeBlockService,
      mocks.dataSyncService,
      Logger.SILENT,
      6_000
    )

    await syncScheduler.start()

    mocks.safeBlockListener({ blockNumber: 2, timestamp: 0 })

    await waitForExpect(() => {
      expect(mocks.dataSyncService.sync).toHaveBeenCalledExactlyWith([
        [{ from: 2, to: 2 }],
        [{ from: 2, to: 2 }],
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

  let safeBlockListener: (block: SafeBlock) => void = () => {}
  const safeBlockService = mock<SafeBlockService>({
    onNewSafeBlock: (listener) => {
      safeBlockListener = listener
      return () => {}
    },
  })

  return {
    statusRepository,
    safeBlockService,
    dataSyncService: mock<DataSyncService>({
      sync: mockFn().resolvesTo(undefined),
      revert: mockFn().resolvesTo(undefined),
    }),
    safeBlockListener: (block: SafeBlock) => safeBlockListener(block),
  }
}
