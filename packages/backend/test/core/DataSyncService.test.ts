import { expect } from 'earljs'

import { DataSyncService } from '../../src/core/DataSyncService'
import type { MemoryHashEventCollector } from '../../src/core/MemoryHashEventCollector'
import type { PageCollector } from '../../src/core/PageCollector'
import { StateTransitionFactCollector } from '../../src/core/StateTransitionFactCollector'
import type { VerifierCollector } from '../../src/core/VerifierCollector'
import { EthereumAddress } from '../../src/model'
import { PageRepository } from '../../src/peripherals/database/PageRepository'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

describe(DataSyncService.name, () => {
  describe(DataSyncService.prototype.sync.name, () => {
    const verifierAddresses = [
      EthereumAddress('0x0000000000000000000000000000000000000123'),
    ]
    const verifierCollector = mock<VerifierCollector>({
      collect: async (_blockRange) => verifierAddresses,
    })
    const memoryHashEventCollector = mock<MemoryHashEventCollector>({
      collect: async (_blockRange, _verifiers) => [],
    })
    const pageCollector = mock<PageCollector>({
      collect: async (_blockRange) => [],
    })
    const stateTransitionFactCollector = mock<StateTransitionFactCollector>({
      collect: async (_blockRange) => [],
    })
    const pageRepository = mock<PageRepository>({
      getAllForFacts: async () => [],
    })

    const service = new DataSyncService(
      verifierCollector,
      memoryHashEventCollector,
      pageCollector,
      stateTransitionFactCollector,
      pageRepository,
      Logger.SILENT
    )

    it('collects data', async () => {
      const blockRange = { from: 10, to: 25 }
      await service.sync(blockRange)

      expect(verifierCollector.collect).toHaveBeenCalledExactlyWith([
        [blockRange],
      ])
      expect(memoryHashEventCollector.collect).toHaveBeenCalledExactlyWith([
        [blockRange, verifierAddresses],
      ])
      expect(pageCollector.collect).toHaveBeenCalledExactlyWith([[blockRange]])
      expect(stateTransitionFactCollector.collect).toHaveBeenCalledExactlyWith([
        [blockRange],
      ])
    })
  })

  describe(DataSyncService.prototype.revert.name, () => {
    it('discards data from block number', () => {})
    // @todo
  })
})
