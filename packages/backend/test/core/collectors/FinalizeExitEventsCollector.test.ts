import { EthereumAddress, Hash256, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { LogWithdrawalPerformed } from '../../../src/core/collectors/events'
import { FinalizeExitEventsCollector } from '../../../src/core/collectors/FinalizeExitEventsCollector'
import { BlockRange } from '../../../src/model'
import { ForcedTransactionRepository } from '../../../src/peripherals/database/ForcedTransactionRepository'
import { TransactionStatusRepository } from '../../../src/peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../../../src/peripherals/ethereum/EthereumClient'
import {
  fakeBlock,
  fakeExit,
  fakeFinalizeLog,
  fakeForcedUpdatesVerified,
  fakeInt,
  fakeTimestamp,
} from '../../fakes'
import { mock } from '../../mock'

const blockRange = new BlockRange([
  {
    number: 9,
    hash: Hash256.fake(),
  },
  {
    number: 10,
    hash: Hash256.fake(),
  },
])

describe(FinalizeExitEventsCollector.name, () => {
  describe(FinalizeExitEventsCollector.prototype.collect.name, () => {
    it('updates existing transaction', async () => {
      const exitHash = Hash256.fake()
      const finalizeHash = Hash256.fake()
      const blockNumber = fakeInt()
      const timestamp = fakeInt()
      const minedAt = Timestamp.fromSeconds(timestamp)
      const sentAt = fakeTimestamp()

      const forcedRepo = mock<ForcedTransactionRepository>({
        findByFinalizeHash: async () =>
          fakeExit({
            hash: exitHash,
            updates: fakeForcedUpdatesVerified({
              hash: finalizeHash,
              minedAt: null,
              revertedAt: null,
              forgottenAt: null,
              sentAt,
            }),
          }),
        findLatestFinalize: async () => undefined,
      })
      const ethereumClient = mock<EthereumClient>({
        getLogsInRange: async () => [
          fakeFinalizeLog({
            blockNumber,
            transactionHash: finalizeHash.toString(),
            topics: [LogWithdrawalPerformed.topic],
          }),
        ],
        getBlock: async () => fakeBlock({ timestamp, number: blockNumber }),
      })
      const transactionStatusRepo = mock<TransactionStatusRepository>({
        updateIfWaitingToBeMined: async () => true,
      })

      const collector = new FinalizeExitEventsCollector(
        ethereumClient,
        forcedRepo,
        transactionStatusRepo,
        EthereumAddress.fake()
      )
      const result = await collector.collect(blockRange)

      expect(result).toEqual({ updated: 1, added: 0, ignored: 0 })
      expect(
        transactionStatusRepo.updateIfWaitingToBeMined
      ).toHaveBeenCalledExactlyWith([
        [{ hash: finalizeHash, mined: { blockNumber, at: minedAt } }],
      ])
    })

    it('adds new transaction', async () => {
      const exitHash = Hash256.fake()
      const finalizeHash = Hash256.fake()
      const blockNumber = fakeInt()
      const timestamp = fakeInt()
      const minedAt = Timestamp.fromSeconds(timestamp)

      const forcedRepo = mock<ForcedTransactionRepository>({
        findByFinalizeHash: async () => undefined,
        getWithdrawalsForFinalize: async () => [fakeExit({ hash: exitHash })],
        saveFinalize: async () => true,
        findLatestFinalize: async () => undefined,
      })
      const ethereumClient = mock<EthereumClient>({
        getLogsInRange: async () => [
          fakeFinalizeLog({
            blockNumber,
            transactionHash: finalizeHash.toString(),
            topics: [LogWithdrawalPerformed.topic],
          }),
        ],
        getBlock: async () => fakeBlock({ timestamp, number: blockNumber }),
      })

      const collector = new FinalizeExitEventsCollector(
        ethereumClient,
        forcedRepo,
        mock<TransactionStatusRepository>({}),
        EthereumAddress.fake()
      )
      const result = await collector.collect(blockRange)

      expect(result).toEqual({ updated: 0, added: 1, ignored: 0 })
      expect(forcedRepo.saveFinalize).toHaveBeenCalledExactlyWith([
        [exitHash, finalizeHash, null, minedAt, blockNumber],
      ])
    })

    it('ignores regular withdraw transactions', async () => {
      const finalizeHash = Hash256.fake()
      const blockNumber = fakeInt()
      const timestamp = fakeInt()

      const forcedRepo = mock<ForcedTransactionRepository>({
        findByFinalizeHash: async () => undefined,
        getWithdrawalsForFinalize: async () => [],
        saveFinalize: async () => true,
        findLatestFinalize: async () => undefined,
      })
      const ethereumClient = mock<EthereumClient>({
        getLogsInRange: async () => [
          fakeFinalizeLog({
            blockNumber,
            transactionHash: finalizeHash.toString(),
            topics: [LogWithdrawalPerformed.topic],
          }),
        ],
        getBlock: async () => fakeBlock({ timestamp, number: blockNumber }),
      })
      const statusRepo = mock<TransactionStatusRepository>({
        updateIfWaitingToBeMined: async () => false,
      })

      const collector = new FinalizeExitEventsCollector(
        ethereumClient,
        forcedRepo,
        statusRepo,
        EthereumAddress.fake()
      )
      const result = await collector.collect(blockRange)

      expect(result).toEqual({ updated: 0, added: 0, ignored: 1 })
      expect(statusRepo.updateIfWaitingToBeMined.calls.length).toEqual(0)
      expect(forcedRepo.saveFinalize.calls.length).toEqual(0)
    })
  })
})
