import { expect } from 'earljs'

import { DataSyncService } from '../../src/core/DataSyncService'
import type { MemoryHashEventCollector } from '../../src/core/MemoryHashEventCollector'
import type { PageCollector } from '../../src/core/PageCollector'
import { StateTransitionFactCollector } from '../../src/core/StateTransitionFactCollector'
import type { VerifierCollector } from '../../src/core/VerifierCollector'
import { BlockRange, EthereumAddress, Hash256 } from '../../src/model'
import { PageRepository } from '../../src/peripherals/database/PageRepository'
import { PositionUpdateRepository } from '../../src/peripherals/database/PositionUpdateRepository'
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
    const positionUpdateRepository = mock<PositionUpdateRepository>({
      addOrUpdate: async () => {},
    })

    const service = new DataSyncService(
      verifierCollector,
      memoryHashEventCollector,
      pageCollector,
      stateTransitionFactCollector,
      pageRepository,
      positionUpdateRepository,
      Logger.SILENT
    )

    it('collects data', async () => {
      const blockRange = { from: 10, to: 25 } as BlockRange
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
      expect(positionUpdateRepository.addOrUpdate).toHaveBeenCalledExactlyWith(
        []
      )
    })
  })

  describe(DataSyncService.prototype.discard.name, () => {
    it('discards data from block number', async () => {
      const noop = async () => {}
      const verifierCollector = mock<VerifierCollector>({ discard: noop })
      const memoryHashEventCollector = mock<MemoryHashEventCollector>({
        discard: noop,
      })
      const pageCollector = mock<PageCollector>({ discard: noop })
      const stateTransitionFactCollector = mock<StateTransitionFactCollector>({
        discard: noop,
      })

      const dataSyncService = new DataSyncService(
        verifierCollector,
        memoryHashEventCollector,
        pageCollector,
        stateTransitionFactCollector,
        mock<PageRepository>({ getAllForFacts: async () => [] }),
        mock<PositionUpdateRepository>({ addOrUpdate: async () => {} }),
        Logger.SILENT
      )

      await dataSyncService.discard({ from: 10 })

      expect(verifierCollector.discard).toHaveBeenCalledWith([{ from: 10 }])
      expect(memoryHashEventCollector.discard).toHaveBeenCalledWith([
        { from: 10 },
      ])
      expect(pageCollector.discard).toHaveBeenCalledWith([{ from: 10 }])
      expect(stateTransitionFactCollector.discard).toHaveBeenCalledWith([
        { from: 10 },
      ])
    })
  })
})
