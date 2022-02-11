import { expect } from 'earljs'

import { DataSyncService } from '../../src/core/DataSyncService'
import type { MemoryHashEventCollector } from '../../src/core/MemoryHashEventCollector'
import type { PageCollector } from '../../src/core/PageCollector'
import { StateTransitionFactCollector } from '../../src/core/StateTransitionFactCollector'
import type { VerifierCollector } from '../../src/core/VerifierCollector'
import { BlockRange, EthereumAddress, Hash256 } from '../../src/model'
import { PageRepository } from '../../src/peripherals/database/PageRepository'
import { RollupStateRepository } from '../../src/peripherals/database/RollupStateRepository'
import { StateUpdateRepository } from '../../src/peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
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
      collect: async (_blockRange) => [
        { hash: Hash256.fake('abcd'), blockNumber: 1 },
      ],
    })
    const pageRepository = mock<PageRepository>({
      getAllForFacts: async () => [],
    })
    const rollupStateRepository = mock<RollupStateRepository>({})
    const stateUpdateRepository = mock<StateUpdateRepository>({
      getLast: async () => undefined,
    })
    const ethereumClient = mock<EthereumClient>({})

    const service = new DataSyncService(
      verifierCollector,
      memoryHashEventCollector,
      pageCollector,
      stateTransitionFactCollector,
      pageRepository,
      rollupStateRepository,
      stateUpdateRepository,
      ethereumClient,
      Logger.SILENT
    )

    it('collects data', async () => {
      const blockRange = { start: 10, end: 25 } as BlockRange
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

      expect(pageRepository.getAllForFacts).toHaveBeenCalledWith([
        [Hash256.fake('abcd')],
      ])
    })
  })

  describe(DataSyncService.prototype.discardAfter.name, () => {
    it('discards data from block number', async () => {
      const noop = async () => {}
      const verifierCollector = mock<VerifierCollector>({ discardAfter: noop })
      const memoryHashEventCollector = mock<MemoryHashEventCollector>({
        discardAfter: noop,
      })
      const pageCollector = mock<PageCollector>({ discardAfter: noop })
      const stateTransitionFactCollector = mock<StateTransitionFactCollector>({
        discardAfter: noop,
      })
      const pageRepository = mock<PageRepository>({})
      const rollupStateRepository = mock<RollupStateRepository>({})
      const stateUpdateRepository = mock<StateUpdateRepository>({
        deleteAllAfter: noop,
      })
      const ethereumClient = mock<EthereumClient>({})

      const dataSyncService = new DataSyncService(
        verifierCollector,
        memoryHashEventCollector,
        pageCollector,
        stateTransitionFactCollector,
        pageRepository,
        rollupStateRepository,
        stateUpdateRepository,
        ethereumClient,
        Logger.SILENT
      )

      await dataSyncService.discardAfter(10)

      expect(verifierCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(memoryHashEventCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(pageCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(stateTransitionFactCollector.discardAfter).toHaveBeenCalledWith([
        10,
      ])
      expect(stateUpdateRepository.deleteAllAfter).toHaveBeenCalledWith([10])
    })
  })
})
