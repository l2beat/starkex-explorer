import { encodeAssetId } from '@explorer/encoding'
import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'

import {
  FinalizeExitEventsCollector,
  LogWithdrawalPerformed,
  PERPETUAL_ABI,
} from '../../src/core/FinalizeExitEventsCollector'
import { BlockRange } from '../../src/model'
import { ForcedTransactionsRepository } from '../../src/peripherals/database/ForcedTransactionsRepository'
import { SyncStatusRepository } from '../../src/peripherals/database/SyncStatusRepository'
import { TransactionStatusRepository } from '../../src/peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import {
  fakeBlock,
  fakeExit,
  fakeFinalizeLog,
  fakeForcedUpdatesVerified,
  fakeInt,
  fakeTimestamp,
} from '../fakes'
import { mock } from '../mock'

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

      const forcedRepo = mock<ForcedTransactionsRepository>({
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
            topics: [LogWithdrawalPerformed],
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
        mock<SyncStatusRepository>(),
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

      const forcedRepo = mock<ForcedTransactionsRepository>({
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
            topics: [LogWithdrawalPerformed],
          }),
        ],
        getBlock: async () => fakeBlock({ timestamp, number: blockNumber }),
      })

      const collector = new FinalizeExitEventsCollector(
        ethereumClient,
        forcedRepo,
        mock<TransactionStatusRepository>({}),
        mock<SyncStatusRepository>(),
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

      const forcedRepo = mock<ForcedTransactionsRepository>({
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
            topics: [LogWithdrawalPerformed],
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
        mock<SyncStatusRepository>(),
        EthereumAddress.fake()
      )
      const result = await collector.collect(blockRange)

      expect(result).toEqual({ updated: 0, added: 0, ignored: 1 })
      expect(statusRepo.updateIfWaitingToBeMined.calls.length).toEqual(0)
      expect(forcedRepo.saveFinalize.calls.length).toEqual(0)
    })
  })

  describe(FinalizeExitEventsCollector.prototype.oneTimeSync.name, () => {
    it('can sync past events', async () => {
      const blockNumber = fakeInt()
      const finalizeHash = Hash256.fake()
      const exitedStarkKey = StarkKey.fake()
      const ethereumClient = mock<EthereumClient>({
        getLogsInRange: async () => [
          fakeFinalizeLog({
            blockNumber,
            transactionHash: finalizeHash.toString(),
            ...PERPETUAL_ABI.encodeEventLog(
              PERPETUAL_ABI.getEvent(LogWithdrawalPerformed),
              [
                exitedStarkKey,
                '0x' + encodeAssetId(AssetId.USDC),
                0,
                0,
                EthereumAddress.fake().toString(),
              ]
            ),
          }),
        ],
        getBlock: async () => fakeBlock(),
      })
      const syncStatusRepo = mock<SyncStatusRepository>({
        getLastSynced: async () => 15000000,
      })
      const forcedTxRepo = mock<ForcedTransactionsRepository>({
        getExitedStarkKeys: async () => [exitedStarkKey],
        findByFinalizeHash: async () => undefined,
        getWithdrawalsForFinalize: async () => [fakeExit()],
        saveFinalize: async () => true,
      })

      const collector = new FinalizeExitEventsCollector(
        ethereumClient,
        forcedTxRepo,
        mock<TransactionStatusRepository>(),
        syncStatusRepo,
        EthereumAddress.fake()
      )
      const result = await collector.oneTimeSync()

      expect(result).toEqual({ added: 3, updated: 0, ignored: 0 })
    })

    it('runs one time only', async () => {
      const ethereumClient = mock<EthereumClient>({
        getLogsInRange: async () => [fakeFinalizeLog()],
      })
      const syncStatusRepo = mock<SyncStatusRepository>({
        getLastSynced: async () => 15000000,
      })
      const forcedTxRepo = mock<ForcedTransactionsRepository>({
        getExitedStarkKeys: async () => [],
      })

      const collector = new FinalizeExitEventsCollector(
        ethereumClient,
        forcedTxRepo,
        mock<TransactionStatusRepository>(),
        syncStatusRepo,
        EthereumAddress.fake()
      )
      await collector.oneTimeSync()
      const result = await collector.oneTimeSync()

      expect(result).not.toBeDefined()
    })
  })
})
