import { EthereumAddress, Hash256 } from '@explorer/types'
import { expect } from 'earljs'

import { FinalizeExitEventsCollector } from '../../src/core/collectors/FinalizeExitEventsCollector'
import { ForcedEventsCollector } from '../../src/core/collectors/ForcedEventsCollector'
import type { PageCollector } from '../../src/core/collectors/PageCollector'
import type { PageMappingCollector } from '../../src/core/collectors/PageMappingCollector'
import { StateTransitionCollector } from '../../src/core/collectors/StateTransitionCollector'
import { UserRegistrationCollector } from '../../src/core/collectors/UserRegistrationCollector'
import type { VerifierCollector } from '../../src/core/collectors/VerifierCollector'
import { DataSyncService } from '../../src/core/DataSyncService'
import { StateUpdater, StateTransition } from '../../src/core/StateUpdater'
import { BlockRange } from '../../src/model'
import { StateTransitionRecord } from '../../src/peripherals/database/StateTransitionRepository'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

const noop = async () => {}

describe(DataSyncService.name, () => {
  describe(DataSyncService.prototype.sync.name, () => {
    const verifierAddresses = [EthereumAddress.fake('123')]
    const verifierCollector = mock<VerifierCollector>({
      collect: async (_blockRange) => verifierAddresses,
    })
    const pageMappingCollector = mock<PageMappingCollector>({
      collect: async (_blockRange, _verifiers) => [],
    })
    const pageCollector = mock<PageCollector>({
      collect: async (_blockRange) => [],
    })

    const stateTransitionsRecords: Omit<StateTransitionRecord, 'id'>[] = [
      { stateTransitionHash: Hash256.fake('abcd'), blockNumber: 1 },
    ]

    const stateTransitionCollector = mock<StateTransitionCollector>({
      collect: async (_blockRange) => stateTransitionsRecords,
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

    const stateTransition: StateTransition = {
      id: 23,
      stateTransitionHash: Hash256.fake('abcd'),
      blockNumber: 1,
      pages: ['aa', 'ab', 'ac'],
    }
    const stateUpdater = mock<StateUpdater>({
      processTransitionRecords: async () => [stateTransition],
      processStateTransition: noop,
    })

    const service = new DataSyncService(
      verifierCollector,
      pageMappingCollector,
      pageCollector,
      stateTransitionCollector,
      stateUpdater,
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
      expect(pageMappingCollector.collect).toHaveBeenCalledExactlyWith([
        [blockRange, verifierAddresses],
      ])
      expect(pageCollector.collect).toHaveBeenCalledExactlyWith([[blockRange]])
      expect(stateTransitionCollector.collect).toHaveBeenCalledExactlyWith([
        [blockRange],
      ])
      expect(forcedEventsCollector.collect).toHaveBeenCalledExactlyWith([
        [blockRange],
      ])
      expect(stateUpdater.processTransitionRecords).toHaveBeenCalledExactlyWith(
        [[stateTransitionsRecords]]
      )
      expect(stateUpdater.processStateTransition).toHaveBeenCalledExactlyWith([
        [stateTransition],
      ])
    })
  })

  describe(DataSyncService.prototype.discardAfter.name, () => {
    it('discards data from block number', async () => {
      const verifierCollector = mock<VerifierCollector>({ discardAfter: noop })
      const pageMappingCollector = mock<PageMappingCollector>({
        discardAfter: noop,
      })
      const pageCollector = mock<PageCollector>({ discardAfter: noop })
      const stateTransitionCollector = mock<StateTransitionCollector>({
        discardAfter: noop,
      })
      const userRegistrationCollector = mock<UserRegistrationCollector>({
        discardAfter: noop,
      })
      const stateUpdater = mock<StateUpdater>({
        discardAfter: noop,
      })
      const forcedEventsCollector = mock<ForcedEventsCollector>()
      const finalizeExitEventsCollector = mock<FinalizeExitEventsCollector>()

      const dataSyncService = new DataSyncService(
        verifierCollector,
        pageMappingCollector,
        pageCollector,
        stateTransitionCollector,
        stateUpdater,
        userRegistrationCollector,
        forcedEventsCollector,
        finalizeExitEventsCollector,
        Logger.SILENT
      )

      await dataSyncService.discardAfter(10)

      expect(verifierCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(pageMappingCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(pageCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(stateTransitionCollector.discardAfter).toHaveBeenCalledWith([10])
      expect(stateUpdater.discardAfter).toHaveBeenCalledWith([10])
    })
  })
})
