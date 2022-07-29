import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect } from 'earljs'

import { DataSyncService } from '../../src/core/DataSyncService'
import { ForcedEventsCollector } from '../../src/core/ForcedEventsCollector'
import type { MemoryHashEventCollector } from '../../src/core/MemoryHashEventCollector'
import type { PageCollector } from '../../src/core/PageCollector'
import { StateTransitionFactCollector } from '../../src/core/StateTransitionFactCollector'
import { StateUpdateCollector } from '../../src/core/StateUpdateCollector'
import { UserRegistrationCollector } from '../../src/core/UserRegistrationCollector'
import type { VerifierCollector } from '../../src/core/VerifierCollector'
import { FinalizeExitEventsCollector } from '../../src/core/FinalizeExitEventsCollector'
import { BlockRange } from '../../src/model'
import { StateTransitionFactRecord } from '../../src/peripherals/database/StateTransitionFactsRepository'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

const noop = async () => {}

describe(DataSyncService.name, () => {
  describe(DataSyncService.prototype.sync.name, () => {
    const verifierAddresses = [EthereumAddress.fake('123')]
    const verifierCollector = mock<VerifierCollector>({
      collect: async (_blockRange) => verifierAddresses,
    })
    const memoryHashEventCollector = mock<MemoryHashEventCollector>({
      collect: async (_blockRange, _verifiers) => [],
    })
    const pageCollector = mock<PageCollector>({
      collect: async (_blockRange) => [],
    })

    const transitionFacts: Omit<StateTransitionFactRecord, 'id'>[] = [
      { hash: Hash256.fake('abcd'), blockNumber: 1 },
    ]

    const stateTransitionFactCollector = mock<StateTransitionFactCollector>({
      collect: async (_blockRange) => transitionFacts,
    })

    const userRegistrationCollector = mock<UserRegistrationCollector>({
      collect: async () => [],
    })
    const forcedEventsCollector = mock<ForcedEventsCollector>({
      collect: async () => ({ added: 0, ignored: 0, updated: 0 }),
    })
    const finalizeExitEventsCollector = mock<FinalizeExitEventsCollector>({
      collect: async () => ({ added: 0, ignored: 0, updated: 0 }),
    })
    const stateUpdateCollector = mock<StateUpdateCollector>({
      save: noop,
    })

    const service = new DataSyncService(
      verifierCollector,
      memoryHashEventCollector,
      pageCollector,
      stateTransitionFactCollector,
      stateUpdateCollector,
      userRegistrationCollector,
      forcedEventsCollector,
      finalizeExitEventsCollector,
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
      expect(stateUpdateCollector.save).toHaveBeenCalledExactlyWith([
        [transitionFacts],
      ])
      expect(forcedEventsCollector.collect).toHaveBeenCalledExactlyWith([
        [blockRange],
      ])
    })
  })

  describe(DataSyncService.prototype.discardAfter.name, () => {
    it('discards data from block number', async () => {
      const verifierCollector = mock<VerifierCollector>({ discardAfter: noop })
      const memoryHashEventCollector = mock<MemoryHashEventCollector>({
        discardAfter: noop,
      })
      const pageCollector = mock<PageCollector>({ discardAfter: noop })
      const stateTransitionFactCollector = mock<StateTransitionFactCollector>({
        discardAfter: noop,
      })
      const userRegistrationCollector = mock<UserRegistrationCollector>({
        discardAfter: noop,
      })
      const stateUpdateCollector = mock<StateUpdateCollector>({
        discardAfter: noop,
      })
      const forcedEventsCollector = mock<ForcedEventsCollector>()
      const finalizeExitEventsCollector = mock<FinalizeExitEventsCollector>()

      const dataSyncService = new DataSyncService(
        verifierCollector,
        memoryHashEventCollector,
        pageCollector,
        stateTransitionFactCollector,
        stateUpdateCollector,
        userRegistrationCollector,
        forcedEventsCollector,
        finalizeExitEventsCollector,
        Logger.SILENT
      )

      await dataSyncService.discardAfter(10)

      expect(verifierCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(memoryHashEventCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(pageCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(stateTransitionFactCollector.discardAfter).toHaveBeenCalledWith([
        10,
      ])
      expect(stateUpdateCollector.discardAfter).toHaveBeenCalledWith([10])
    })
  })
})
