import { AssetId, EthereumAddress, Hash256, Timestamp } from '@explorer/types'
import { expect, mockObject } from 'earljs'

import { BlockRange } from '../../model'
import { ForcedTransactionRepository } from '../../peripherals/database/ForcedTransactionRepository'
import { TransactionStatusRepository } from '../../peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import {
  fakeBlock,
  fakeExit,
  fakeFinalizeLog,
  fakeForcedUpdatesVerified,
  fakeInt,
  fakeTimestamp,
} from '../../test/fakes'
import { LogWithdrawalPerformed } from './events'
import { FinalizeExitEventsCollector } from './FinalizeExitEventsCollector'

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

      const forcedRepo = mockObject<ForcedTransactionRepository>({
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
      const ethereumClient = mockObject<EthereumClient>({
        getLogsInRange: async () => [
          fakeFinalizeLog({
            blockNumber,
            transactionHash: finalizeHash.toString(),
            topics: [LogWithdrawalPerformed.topic],
          }),
        ],
        getBlock: async () => fakeBlock({ timestamp, number: blockNumber }),
      })
      const transactionStatusRepo = mockObject<TransactionStatusRepository>({
        updateIfWaitingToBeMined: async () => true,
      })

      const collector = new FinalizeExitEventsCollector(
        ethereumClient,
        forcedRepo,
        transactionStatusRepo,
        EthereumAddress.fake()
      )
      const result = await collector.collect(blockRange, AssetId('USDC-6'))

      expect(result).toEqual({ updated: 1, added: 0, ignored: 0 })
      expect(
        transactionStatusRepo.updateIfWaitingToBeMined
      ).toHaveBeenOnlyCalledWith({
        hash: finalizeHash,
        mined: { blockNumber, at: minedAt },
      })
    })

    it('adds new transaction', async () => {
      const exitHash = Hash256.fake()
      const finalizeHash = Hash256.fake()
      const blockNumber = fakeInt()
      const timestamp = fakeInt()
      const minedAt = Timestamp.fromSeconds(timestamp)

      const forcedRepo = mockObject<ForcedTransactionRepository>({
        findByFinalizeHash: async () => undefined,
        getWithdrawalsForFinalize: async () => [fakeExit({ hash: exitHash })],
        saveFinalize: async () => true,
        findLatestFinalize: async () => undefined,
      })
      const ethereumClient = mockObject<EthereumClient>({
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
        mockObject<TransactionStatusRepository>({}),
        EthereumAddress.fake()
      )
      const result = await collector.collect(blockRange, AssetId('USDC-6'))

      expect(result).toEqual({ updated: 0, added: 1, ignored: 0 })
      expect(forcedRepo.saveFinalize).toHaveBeenOnlyCalledWith(
        exitHash,
        finalizeHash,
        null,
        minedAt,
        blockNumber
      )
    })

    it('ignores regular withdraw transactions', async () => {
      const finalizeHash = Hash256.fake()
      const blockNumber = fakeInt()
      const timestamp = fakeInt()

      const forcedRepo = mockObject<ForcedTransactionRepository>({
        findByFinalizeHash: async () => undefined,
        getWithdrawalsForFinalize: async () => [],
        saveFinalize: async () => true,
        findLatestFinalize: async () => undefined,
      })
      const ethereumClient = mockObject<EthereumClient>({
        getLogsInRange: async () => [
          fakeFinalizeLog({
            blockNumber,
            transactionHash: finalizeHash.toString(),
            topics: [LogWithdrawalPerformed.topic],
          }),
        ],
        getBlock: async () => fakeBlock({ timestamp, number: blockNumber }),
      })
      const statusRepo = mockObject<TransactionStatusRepository>({
        updateIfWaitingToBeMined: async () => false,
      })

      const collector = new FinalizeExitEventsCollector(
        ethereumClient,
        forcedRepo,
        statusRepo,
        EthereumAddress.fake()
      )
      const result = await collector.collect(blockRange, AssetId('USDC-6'))

      expect(result).toEqual({ updated: 0, added: 0, ignored: 1 })
      expect(statusRepo.updateIfWaitingToBeMined).toHaveBeenCalledTimes(0)
      expect(forcedRepo.saveFinalize).toHaveBeenCalledTimes(0)
    })
  })
})
