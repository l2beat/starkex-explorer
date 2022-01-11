import { expect } from 'chai'
import waitForExpect from 'wait-for-expect'

import { DataSyncService } from '../../src/core/DataSyncService'
import { SafeBlock, SafeBlockService } from '../../src/core/SafeBlockService'
import { SyncScheduler } from '../../src/core/SyncScheduler'
import { KeyValueStore } from '../../src/peripherals/database/KeyValueStore'
import { BlockRange } from '../../src/peripherals/ethereum/types'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

describe.only(SyncScheduler.name, () => {
  it('syncs in batches', async () => {
    const {
      kvStore,
      safeBlockService,
      dataSyncService,
      calls,
      safeBlockListener,
    } = setupMocks({ lastBlockNumberSynced: '1' })

    const earliestBlock = 0
    const batchSize = 3
    const syncScheduler = new SyncScheduler(
      kvStore,
      safeBlockService,
      dataSyncService,
      Logger.SILENT,
      earliestBlock,
      batchSize
    )

    await syncScheduler.start()
    expect(calls.revert).not.to.be.empty

    safeBlockListener({ blockNumber: 10, timestamp: 0 })

    const expectedSyncCalls = [
      { from: 2, to: 4 },
      { from: 5, to: 7 },
      { from: 8, to: 10 },
    ]

    await waitForExpect(() => {
      expect(calls.sync).to.deep.eq(expectedSyncCalls)
    })
  })

  it('respects earliestBlock', async () => {
    const {
      kvStore,
      safeBlockService,
      dataSyncService,
      calls,
      safeBlockListener,
    } = setupMocks({
      lastBlockNumberSynced: undefined,
    })

    const earliestBlock = 1000
    const syncScheduler = new SyncScheduler(
      kvStore,
      safeBlockService,
      dataSyncService,
      Logger.SILENT,
      earliestBlock
    )

    await syncScheduler.start()

    safeBlockListener({ blockNumber: 1010, timestamp: 0 })

    await waitForExpect(() => {
      expect(calls.sync).to.deep.eq([{ from: earliestBlock + 1, to: 1010 }])
    })
  })

  it('handles incoming new blocks', async () => {
    const {
      kvStore,
      safeBlockService,
      dataSyncService,
      calls,
      safeBlockListener,
    } = setupMocks()

    const earliestBlock = 0
    const batchSize = 50
    const syncScheduler = new SyncScheduler(
      kvStore,
      safeBlockService,
      dataSyncService,
      Logger.SILENT,
      earliestBlock,
      batchSize
    )

    await syncScheduler.start()
    expect(calls.revert).not.to.be.empty

    safeBlockListener({ blockNumber: 8, timestamp: 0 })
    safeBlockListener({ blockNumber: 9, timestamp: 0 })
    safeBlockListener({ blockNumber: 100, timestamp: 0 })

    const expectedSyncCalls = [
      { from: 1, to: 8 },
      { from: 9, to: 9 },
      { from: 10, to: 59 },
      { from: 60, to: 100 },
    ]

    await waitForExpect(() => {
      expect(calls.sync).to.deep.eq(expectedSyncCalls)
    })
  })

  it('reruns failing syncs', async () => {
    const mocks = setupMocks()

    let failed = false
    const _sync = mocks.dataSyncService.sync
    mocks.dataSyncService.sync = async (...args) => {
      _sync(...args)
      if (!failed) {
        failed = true
        throw new Error('failed as expected')
      }
    }

    const syncScheduler = new SyncScheduler(
      mocks.kvStore,
      mocks.safeBlockService,
      mocks.dataSyncService,
      Logger.SILENT,
      1
    )

    await syncScheduler.start()

    mocks.safeBlockListener({ blockNumber: 2, timestamp: 0 })

    await waitForExpect(() => {
      expect(mocks.calls.sync).to.deep.eq([
        { from: 2, to: 2 },
        { from: 2, to: 2 },
      ])
    })
  })
})

function setupMocks({
  lastBlockNumberSynced = undefined,
}: {
  lastBlockNumberSynced?: string
} = {}) {
  let kvStoreValue: string | undefined = lastBlockNumberSynced
  const kvStore = mock<KeyValueStore<string>>({
    async get(key) {
      expect(key).to.equal('lastBlockNumberSynced')
      return kvStoreValue
    },
    async set(key, value) {
      expect(key).to.equal('lastBlockNumberSynced')
      kvStoreValue = value
    },
  })

  let safeBlockListener: (block: SafeBlock) => void = () => {}
  const safeBlockService = mock<SafeBlockService>({
    onNewSafeBlock: (listener) => {
      safeBlockListener = listener
      return () => {}
    },
  })

  // @todo earljs or sinon mocks?
  const calls = {
    revert: [] as unknown[],
    sync: [] as BlockRange[],
  }

  const dataSyncService = mock<DataSyncService>({
    async revert() {
      calls.revert.push([])
    },
    async sync(blockRange) {
      calls.sync.push(blockRange)
    },
  })

  return {
    kvStore,
    safeBlockService,
    dataSyncService,
    calls,
    safeBlockListener: (block: SafeBlock) => safeBlockListener(block),
  }
}
