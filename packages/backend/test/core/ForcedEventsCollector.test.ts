import { Hash256, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { ForcedEventsCollector } from '../../src/core/ForcedEventsCollector'
import { BlockRange } from '../../src/model'
import { ForcedTransactionsRepository } from '../../src/peripherals/database/ForcedTransactionsRepository'
import { TransactionStatusRepository } from '../../src/peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import {
  fakeForcedUpdates,
  fakeInt,
  fakeTimestamp,
  fakeWithdrawal,
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

describe(ForcedEventsCollector.name, () => {
  describe(ForcedEventsCollector.prototype.collect.name, () => {
    it('adds new transaction', async () => {
      const hash = Hash256.fake()
      const data = fakeWithdrawal()
      const blockNumber = fakeInt()
      const minedAt = fakeTimestamp()
      const forcedRepo = mock<ForcedTransactionsRepository>({
        findByHash: async () => undefined,
        add: async () => hash,
      })
      const statusRepo = mock<TransactionStatusRepository>({})
      const collector = new ForcedEventsCollector(
        mock<EthereumClient>({}),
        forcedRepo,
        statusRepo,
        async () => [
          {
            hash,
            data,
            blockNumber,
            minedAt,
          },
        ]
      )
      const result = await collector.collect(blockRange)
      expect(result).toEqual({ updated: 0, added: 1, ignored: 0 })
      expect(forcedRepo.add).toHaveBeenCalledExactlyWith([
        [{ hash, data }, null, minedAt, blockNumber],
      ])
    })

    it('updates existing transaction', async () => {
      const hash = Hash256.fake()
      const data = fakeWithdrawal()
      const blockNumber = fakeInt()
      const minedAt = Timestamp(2)
      const sentAt = Timestamp(1)
      const forcedRepo = mock<ForcedTransactionsRepository>({
        findByHash: async () => ({
          data,
          hash,
          lastUpdateAt: sentAt,
          updates: fakeForcedUpdates({ sentAt }),
        }),
      })
      const statusRepo = mock<TransactionStatusRepository>({
        updateIfWaitingToBeMined: async () => true,
      })

      const collector = new ForcedEventsCollector(
        mock<EthereumClient>({}),
        forcedRepo,
        statusRepo,
        async () => [
          {
            hash,
            data,
            blockNumber,
            minedAt,
          },
        ]
      )
      const result = await collector.collect(blockRange)
      expect(result).toEqual({ updated: 1, added: 0, ignored: 0 })
      expect(statusRepo.updateIfWaitingToBeMined).toHaveBeenCalledExactlyWith([
        [{ hash, mined: { blockNumber, at: minedAt } }],
      ])
    })

    it('ignores mined transactions', async () => {
      const hash = Hash256.fake()
      const data = fakeWithdrawal()
      const blockNumber = fakeInt()
      const minedAt = Timestamp(2)
      const sentAt = Timestamp(1)
      const forcedRepo = mock<ForcedTransactionsRepository>({
        findByHash: async () => ({
          data,
          hash,
          lastUpdateAt: minedAt,
          updates: fakeForcedUpdates({ sentAt, minedAt }),
        }),
        add: async () => hash,
      })
      const statusRepo = mock<TransactionStatusRepository>({
        updateIfWaitingToBeMined: async () => true,
      })
      const collector = new ForcedEventsCollector(
        mock<EthereumClient>({}),
        forcedRepo,
        statusRepo,
        async () => [
          {
            hash,
            data,
            blockNumber,
            minedAt,
          },
        ]
      )
      const result = await collector.collect(blockRange)
      expect(result).toEqual({ updated: 0, added: 0, ignored: 1 })
      expect(statusRepo.updateIfWaitingToBeMined.calls.length).toEqual(0)
      expect(forcedRepo.add.calls.length).toEqual(0)
    })
  })
})
