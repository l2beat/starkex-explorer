import { Hash256, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { ForcedEventsCollector } from '../../src/core/ForcedEventsCollector'
import { BlockRange } from '../../src/model'
import { ForcedTransactionsRepository } from '../../src/peripherals/database/ForcedTransactionsRepository'
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
      const repo = mock<ForcedTransactionsRepository>({
        findByHash: async () => undefined,
        add: async () => hash,
      })
      const collector = new ForcedEventsCollector(
        mock<EthereumClient>({}),
        repo,
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
      expect(repo.add).toHaveBeenCalledExactlyWith([
        [{ hash, data }, null, minedAt, blockNumber],
      ])
    })

    it('updates existing transaction', async () => {
      const hash = Hash256.fake()
      const data = fakeWithdrawal()
      const blockNumber = fakeInt()
      const minedAt = Timestamp(2)
      const sentAt = Timestamp(1)
      const repo = mock<ForcedTransactionsRepository>({
        findByHash: async () => ({
          data,
          hash,
          lastUpdateAt: sentAt,
          updates: fakeForcedUpdates({ sentAt }),
        }),
        markAsMined: async () => true,
      })
      const collector = new ForcedEventsCollector(
        mock<EthereumClient>({}),
        repo,
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
      expect(repo.markAsMined).toHaveBeenCalledExactlyWith([
        [hash, blockNumber, minedAt],
      ])
    })

    it('ignores mined transactions', async () => {
      const hash = Hash256.fake()
      const data = fakeWithdrawal()
      const blockNumber = fakeInt()
      const minedAt = Timestamp(2)
      const sentAt = Timestamp(1)
      const repo = mock<ForcedTransactionsRepository>({
        findByHash: async () => ({
          data,
          hash,
          lastUpdateAt: minedAt,
          updates: fakeForcedUpdates({ sentAt, minedAt }),
        }),
        markAsMined: async () => true,
        add: async () => hash,
      })
      const collector = new ForcedEventsCollector(
        mock<EthereumClient>({}),
        repo,
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
      expect(repo.markAsMined.calls.length).toEqual(0)
      expect(repo.add.calls.length).toEqual(0)
    })
  })
})
