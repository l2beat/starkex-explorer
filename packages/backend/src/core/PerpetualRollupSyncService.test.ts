import { EthereumAddress, Hash256 } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect, mockFn, mockObject } from 'earl'

import { BlockRange } from '../model'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRecord } from '../peripherals/database/StateUpdateRepository'
import { decodedFakePages, fakePages } from '../test/fakes'
import type { PageCollector } from './collectors/PageCollector'
import type { PageMappingCollector } from './collectors/PageMappingCollector'
import { PerpetualRollupStateTransitionCollector } from './collectors/PerpetualRollupStateTransitionCollector'
import { UserRegistrationCollector } from './collectors/UserRegistrationCollector'
import { UserTransactionCollector } from './collectors/UserTransactionCollector'
import type { VerifierCollector } from './collectors/VerifierCollector'
import { WithdrawalAllowedCollector } from './collectors/WithdrawalAllowedCollector'
import { PerpetualRollupSyncService } from './PerpetualRollupSyncService'
import {
  PerpetualRollupStateTransition,
  PerpetualRollupUpdater,
} from './PerpetualRollupUpdater'
const noop = async () => {}

describe(PerpetualRollupSyncService.name, () => {
  describe(PerpetualRollupSyncService.prototype.sync.name, () => {
    const verifierAddresses = [EthereumAddress.fake('123')]
    const verifierCollector = mockObject<VerifierCollector>({
      collect: async (_blockRange) => verifierAddresses,
    })
    const pageMappingCollector = mockObject<PageMappingCollector>({
      collect: async (_blockRange, _verifiers) => [],
    })
    const pageCollector = mockObject<PageCollector>({
      collect: async (_blockRange) => [],
    })

    const stateTransitionsRecords: PerpetualRollupStateTransition[] = [
      {
        stateTransitionHash: Hash256.fake('abcd'),
        blockNumber: 1,
        transactionHash: Hash256.fake(),
        sequenceNumber: 10,
        batchId: 9,
      },
    ]

    const stateTransitionCollector =
      mockObject<PerpetualRollupStateTransitionCollector>({
        collect: async (_blockRange) => stateTransitionsRecords,
      })

    const userRegistrationCollector = mockObject<UserRegistrationCollector>({
      collect: async () => [],
    })
    const userTransactionCollector = mockObject<UserTransactionCollector>({
      collect: async () => {},
    })
    const withdrawalAllowedCollector = mockObject<WithdrawalAllowedCollector>({
      collect: async () => {},
    })

    const stateTransitionRecordWithPages: PerpetualRollupStateTransition & {
      pages: string[]
      id: number
    } = {
      id: stateTransitionsRecords[0]!.batchId + 1,
      batchId: stateTransitionsRecords[0]!.batchId,
      stateTransitionHash: stateTransitionsRecords[0]!.stateTransitionHash,
      blockNumber: stateTransitionsRecords[0]!.blockNumber,
      sequenceNumber: stateTransitionsRecords[0]!.sequenceNumber,
      transactionHash: stateTransitionsRecords[0]!.transactionHash,
      pages: fakePages,
    }
    const perpetualRollupUpdater = mockObject<PerpetualRollupUpdater>({
      loadRequiredPages: async () => [stateTransitionRecordWithPages],
      processOnChainStateTransition: mockFn(
        async () => ({} as StateUpdateRecord)
      ),
    })

    const stateTransitionRecord: StateTransitionRecord = {
      id: stateTransitionRecordWithPages.id,
      stateTransitionHash: stateTransitionRecordWithPages.stateTransitionHash,
      blockNumber: stateTransitionRecordWithPages.blockNumber,
    }

    const service = new PerpetualRollupSyncService(
      verifierCollector,
      pageMappingCollector,
      pageCollector,
      stateTransitionCollector,
      perpetualRollupUpdater,
      userRegistrationCollector,
      userTransactionCollector,
      withdrawalAllowedCollector,
      Logger.SILENT
    )

    it('collects data', async () => {
      const blockRange = { start: 10, end: 25 } as BlockRange
      await service.sync(blockRange)

      expect(verifierCollector.collect).toHaveBeenOnlyCalledWith(blockRange)
      expect(pageMappingCollector.collect).toHaveBeenOnlyCalledWith(
        blockRange,
        verifierAddresses
      )
      expect(pageCollector.collect).toHaveBeenOnlyCalledWith(blockRange)
      expect(stateTransitionCollector.collect).toHaveBeenOnlyCalledWith(
        blockRange
      )
      expect(userTransactionCollector.collect).toHaveBeenOnlyCalledWith(
        blockRange
      )
      expect(withdrawalAllowedCollector.collect).toHaveBeenOnlyCalledWith(
        blockRange
      )
      expect(perpetualRollupUpdater.loadRequiredPages).toHaveBeenOnlyCalledWith(
        stateTransitionsRecords
      )
      expect(
        perpetualRollupUpdater.processOnChainStateTransition
      ).toHaveBeenOnlyCalledWith(
        stateTransitionRecord,
        stateTransitionsRecords[0]!.batchId,
        decodedFakePages
      )
    })
  })

  describe(PerpetualRollupSyncService.prototype.discardAfter.name, () => {
    it('discards data from block number', async () => {
      const verifierCollector = mockObject<VerifierCollector>({
        discardAfter: noop,
      })
      const pageMappingCollector = mockObject<PageMappingCollector>({
        discardAfter: noop,
      })
      const pageCollector = mockObject<PageCollector>({ discardAfter: noop })
      const stateTransitionCollector =
        mockObject<PerpetualRollupStateTransitionCollector>({
          discardAfter: noop,
        })
      const userRegistrationCollector = mockObject<UserRegistrationCollector>({
        discardAfter: noop,
      })
      const perpetualRollupUpdater = mockObject<PerpetualRollupUpdater>({
        discardAfter: noop,
      })
      const userTransactionCollector = mockObject<UserTransactionCollector>({
        discardAfter: noop,
      })
      const withdrawalAllowedCollector = mockObject<WithdrawalAllowedCollector>(
        {
          discardAfter: noop,
        }
      )

      const dataSyncService = new PerpetualRollupSyncService(
        verifierCollector,
        pageMappingCollector,
        pageCollector,
        stateTransitionCollector,
        perpetualRollupUpdater,
        userRegistrationCollector,
        userTransactionCollector,
        withdrawalAllowedCollector,
        Logger.SILENT
      )

      await dataSyncService.discardAfter(10)

      expect(verifierCollector.discardAfter).toHaveBeenOnlyCalledWith(10)
      expect(pageMappingCollector.discardAfter).toHaveBeenOnlyCalledWith(10)
      expect(pageCollector.discardAfter).toHaveBeenOnlyCalledWith(10)
      expect(stateTransitionCollector.discardAfter).toHaveBeenOnlyCalledWith(10)
      expect(perpetualRollupUpdater.discardAfter).toHaveBeenOnlyCalledWith(10)
      expect(userRegistrationCollector.discardAfter).toHaveBeenOnlyCalledWith(
        10
      )
      expect(userTransactionCollector.discardAfter).toHaveBeenOnlyCalledWith(10)
      expect(withdrawalAllowedCollector.discardAfter).toHaveBeenOnlyCalledWith(
        10
      )
    })
  })
})
