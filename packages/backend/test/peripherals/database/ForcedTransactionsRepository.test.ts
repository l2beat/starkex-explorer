import { Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { ForcedTransactionsRepository } from '../../../src/peripherals/database/ForcedTransactionsRepository'
import { Logger } from '../../../src/tools/Logger'
import {
  fakeBigInt,
  fakeForcedUpdates,
  fakeInt,
  fakeTimestamp,
  fakeTrade,
  fakeWithdrawal,
} from '../../fakes'
import { setupDatabaseTestSuite } from './setup'

describe(ForcedTransactionsRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new ForcedTransactionsRepository(knex, Logger.SILENT)

  beforeEach(() => repository.deleteAll())

  it('adds transaction', async () => {
    const tx1 = {
      hash: Hash256.fake(),
      data: fakeWithdrawal(),
    }
    const tx2 = {
      hash: Hash256.fake(),
      data: fakeWithdrawal(),
    }
    const tx3 = {
      hash: Hash256.fake(),
      data: fakeWithdrawal(),
    }
    const tx4 = {
      hash: Hash256.fake(),
      data: fakeWithdrawal(),
    }

    const sentAt1 = fakeTimestamp()
    const sentAt2 = fakeTimestamp()
    const sentAt3 = null
    const minedAt3 = fakeTimestamp()
    const blockNumber3 = fakeInt()
    const sentAt4 = Timestamp(1)
    const minedAt4 = Timestamp(2)
    const blockNumber4 = fakeInt()

    await repository.add(tx1, sentAt1)
    await repository.add(tx2, sentAt2)
    await repository.add(tx3, sentAt3, minedAt3, blockNumber3)
    await repository.add(tx4, sentAt4, minedAt4, blockNumber4)

    const actual = await repository.getAll()

    expect(actual).toEqual([
      {
        ...tx1,
        lastUpdateAt: sentAt1,
        updates: fakeForcedUpdates({
          sentAt: sentAt1,
        }),
      },
      {
        ...tx2,
        lastUpdateAt: sentAt2,
        updates: fakeForcedUpdates({
          sentAt: sentAt2,
        }),
      },
      {
        ...tx3,
        lastUpdateAt: minedAt3,
        updates: fakeForcedUpdates({
          sentAt: sentAt3,
          minedAt: minedAt3,
        }),
      },
      {
        ...tx4,
        lastUpdateAt: minedAt4,
        updates: fakeForcedUpdates({
          sentAt: sentAt4,
          minedAt: minedAt4,
        }),
      },
    ])
  })

  it('returns no transaction hashes if no data passed', async () => {
    const hashes = await repository.getTransactionHashesByData([])
    expect(hashes).toEqual([])
  })

  it('returns transaction hashes', async () => {
    const hash1 = Hash256.fake()
    const data1 = fakeWithdrawal()

    const hash2 = Hash256.fake()
    const data2 = fakeTrade()

    await repository.add(
      {
        hash: hash1,
        data: data1,
      },
      null,
      fakeTimestamp(),
      fakeInt()
    )
    await repository.add(
      {
        hash: hash2,
        data: data2,
      },
      null,
      fakeTimestamp(),
      fakeInt()
    )

    const hashes = await repository.getTransactionHashesByData([
      data1,
      data2,
      { ...data2, publicKeyA: StarkKey.fake() },
    ])

    expect(hashes).toEqual([hash1, hash2, undefined])
  })

  it('returns latest transactions', async () => {
    const hash1 = Hash256.fake()
    const data1 = fakeWithdrawal()
    const sentAt1 = Timestamp(3)
    const hash2 = Hash256.fake()
    const data2 = fakeTrade()
    const sentAt2 = Timestamp(1)
    const minedAt2 = Timestamp(2)
    const blockNumber2 = fakeInt()
    const hash3 = Hash256.fake()
    const data3 = fakeWithdrawal()
    const sentAt3 = Timestamp(4)

    await repository.add(
      {
        hash: hash1,
        data: data1,
      },
      sentAt1
    )
    await repository.add(
      {
        hash: hash2,
        data: data2,
      },
      sentAt2,
      minedAt2,
      blockNumber2
    )
    await repository.add(
      {
        hash: hash3,
        data: data3,
      },
      sentAt3
    )

    const latest = await repository.getLatest({ limit: 10, offset: 0 })

    const expected = [
      {
        hash: hash3,
        data: data3,
        lastUpdateAt: sentAt3,
        updates: fakeForcedUpdates({
          sentAt: sentAt3,
        }),
      },
      {
        hash: hash1,
        data: data1,
        lastUpdateAt: sentAt1,
        updates: fakeForcedUpdates({
          sentAt: sentAt1,
        }),
      },
      {
        hash: hash2,
        data: data2,
        lastUpdateAt: minedAt2,
        updates: fakeForcedUpdates({
          sentAt: sentAt2,
          minedAt: minedAt2,
        }),
      },
    ]

    expect(latest).toEqual(expected)

    const offset = await repository.getLatest({ limit: 10, offset: 2 })
    expect(offset).toEqual([expected[2]])
  })

  it('returns transactions affecting position', async () => {
    const positionId = fakeBigInt()
    const hash1 = Hash256.fake()
    const data1 = fakeWithdrawal({ positionId })
    const sentAt1 = fakeTimestamp()
    const hash2 = Hash256.fake()
    const data2 = fakeTrade({ positionIdA: positionId })
    const sentAt2 = Timestamp(1)
    const minedAt2 = Timestamp(2)
    const blockNumber2 = fakeInt()
    const hash3 = Hash256.fake()
    const data3 = fakeWithdrawal({ positionId: positionId + 1n })
    const sentAt3 = fakeTimestamp()

    await repository.add(
      {
        hash: hash1,
        data: data1,
      },
      sentAt1
    )
    await repository.add(
      {
        hash: hash2,
        data: data2,
      },
      sentAt2,
      minedAt2,
      blockNumber2
    )
    await repository.add(
      {
        hash: hash3,
        data: data3,
      },
      sentAt3
    )

    const transactions = await repository.getAffectingPosition(positionId)
    expect(transactions).toEqual([
      {
        hash: hash1,
        data: data1,
        lastUpdateAt: sentAt1,
        updates: fakeForcedUpdates({
          sentAt: sentAt1,
        }),
      },
      {
        hash: hash2,
        data: data2,
        lastUpdateAt: minedAt2,
        updates: fakeForcedUpdates({
          sentAt: sentAt2,
          minedAt: minedAt2,
        }),
      },
    ])

    const unknownPositionTransactions = await repository.getAffectingPosition(
      999n
    )
    expect(unknownPositionTransactions).toEqual([])
  })

  it('counts all transactions', async () => {
    const hash1 = Hash256.fake()
    const data1 = fakeWithdrawal()
    const sentAt1 = fakeTimestamp()
    const hash2 = Hash256.fake()
    const data2 = fakeTrade()
    const sentAt2 = Timestamp(1)
    const minedAt2 = Timestamp(2)
    const blockNumber2 = fakeInt()

    await repository.add(
      {
        hash: hash1,
        data: data1,
      },
      sentAt1
    )
    await repository.add(
      {
        hash: hash2,
        data: data2,
      },
      sentAt2,
      minedAt2,
      blockNumber2
    )

    const count = await repository.countAll()

    expect(count).toEqual(2n)
  })

  it('returns undefined if transaction not found by hash', async () => {
    const transaction = await repository.findByHash(Hash256.fake())
    expect(transaction).not.toBeDefined()
  })

  it('gets by hash', async () => {
    const hash = Hash256.fake()
    const data = fakeWithdrawal()
    const sentAt = fakeTimestamp()

    await repository.add(
      {
        hash,
        data,
      },
      sentAt
    )
    const transaction = await repository.findByHash(hash)
    expect(transaction).toEqual({
      data,
      hash,
      lastUpdateAt: sentAt,
      updates: fakeForcedUpdates({ sentAt }),
    })
  })
})
