import { Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earl'

import { setupDatabaseTestSuite } from '../../test/database'
import {
  fakeBigInt,
  fakeExit,
  fakeFinalize,
  fakeForcedUpdates,
  fakeInt,
  fakeStateUpdate,
  fakeTimestamp,
  fakeTrade,
  fakeWithdrawal,
} from '../../test/fakes'
import { Logger } from '../../tools/Logger'
import { ForcedTransactionRepository } from './ForcedTransactionRepository'
import { StateUpdateRepository } from './StateUpdateRepository'

const MAX_TIME = 2 ** 32 - 1
describe(ForcedTransactionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new ForcedTransactionRepository(database, Logger.SILENT)

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

    expect(actual).toEqualUnsorted([
      {
        ...tx1,
        lastUpdateAt: sentAt1,
        updates: fakeForcedUpdates({ sentAt: sentAt1 }),
      },
      {
        ...tx2,
        lastUpdateAt: sentAt2,
        updates: fakeForcedUpdates({ sentAt: sentAt2 }),
      },
      {
        ...tx3,
        lastUpdateAt: minedAt3,
        updates: fakeForcedUpdates({ sentAt: sentAt3, minedAt: minedAt3 }),
      },
      {
        ...tx4,
        lastUpdateAt: minedAt4,
        updates: fakeForcedUpdates({ sentAt: sentAt4, minedAt: minedAt4 }),
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

    const data3 = { ...data2, starkKeyA: StarkKey.fake() }

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
      data3,
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
    expect(offset).toEqual([expected[2]!])
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

    const transactions = await repository.getByPositionId(positionId)

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

    const unknownPositionTransactions = await repository.getByPositionId(999n)
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

    expect(count).toEqual(2)
  })

  it('counts pending transactions affecting position', async () => {
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
    expect(await repository.countPendingByPositionId(positionId)).toEqual(2)
  })

  it('returns undefined if transaction not found by hash', async () => {
    const transaction = await repository.findByHash(Hash256.fake())
    expect(transaction).toEqual(undefined)
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

  it('saves finalize transaction', async () => {
    const tx1 = {
      hash: Hash256.fake(),
      data: fakeWithdrawal(),
    }
    const tx2 = {
      hash: Hash256.fake(),
      data: fakeWithdrawal(),
    }
    const finalize1 = {
      hash: Hash256.fake(),
      data: fakeFinalize(),
    }
    const finalize2 = {
      hash: Hash256.fake(),
      data: fakeFinalize(),
    }

    const sentAtFinalize1 = fakeTimestamp()
    const sentAt1 = fakeTimestamp(Number(sentAtFinalize1 as unknown as string))
    const sentAt2 = null
    const minedAtFinalize2 = fakeTimestamp()
    const minedAt2 = fakeTimestamp(
      Number(minedAtFinalize2 as unknown as string)
    )
    const blockNumber2 = fakeInt()

    await repository.add(tx1, sentAt1)
    await repository.add(tx2, sentAt2, minedAt2, blockNumber2)

    const sentAtFinalize2 = null
    const blockNumberFinalize2 = fakeInt()

    await repository.saveFinalize(tx1.hash, finalize1.hash, sentAtFinalize1)
    await repository.saveFinalize(
      tx2.hash,
      finalize2.hash,
      sentAtFinalize2,
      minedAtFinalize2,
      blockNumberFinalize2
    )

    const actual = await repository.getAll()
    expect(actual).toEqualUnsorted([
      {
        ...tx1,
        lastUpdateAt: sentAtFinalize1,
        updates: fakeForcedUpdates({
          sentAt: sentAt1,
          finalized: {
            hash: finalize1.hash,
            sentAt: sentAtFinalize1,
            forgottenAt: null,
            revertedAt: null,
            minedAt: null,
          },
        }),
      },
      {
        ...tx2,
        lastUpdateAt: minedAtFinalize2,
        updates: fakeForcedUpdates({
          sentAt: sentAt2,
          minedAt: minedAt2,
          finalized: {
            hash: finalize2.hash,
            sentAt: null,
            forgottenAt: null,
            revertedAt: null,
            minedAt: minedAtFinalize2,
          },
        }),
      },
    ])
  })

  it('finds exit by data for finalize', async () => {
    const starkKey = StarkKey.fake()
    const expectedMinedAt = fakeTimestamp()
    const stateUpdateAt = fakeTimestamp()
    const stateUpdateId = fakeInt()

    const exit1 = fakeExit()
    const expectedExit = fakeExit({
      data: fakeWithdrawal({ starkKey }),
    })
    const exit3 = fakeExit()

    await repository.add(exit1, null, fakeTimestamp(), 0)
    await repository.add(expectedExit, null, expectedMinedAt, 0)
    await repository.add(exit3, null, fakeTimestamp(), 0)

    const stateUpdateRepo = new StateUpdateRepository(database, Logger.SILENT)
    await stateUpdateRepo.add({
      stateUpdate: fakeStateUpdate({
        timestamp: stateUpdateAt,
        id: stateUpdateId,
      }),
      positions: [],
      prices: [],
      transactionHashes: [expectedExit.hash],
    })

    const result = await repository.getWithdrawalsForFinalize(
      starkKey,
      Timestamp(MAX_TIME),
      Timestamp(0)
    )
    expect(result).toEqual([
      {
        ...expectedExit,
        updates: {
          finalized: undefined,
          sentAt: null,
          forgottenAt: null,
          revertedAt: null,
          minedAt: expectedMinedAt,
          verified: {
            at: stateUpdateAt,
            stateUpdateId,
          },
        },
        lastUpdateAt:
          Number(stateUpdateAt) > Number(expectedMinedAt)
            ? stateUpdateAt
            : expectedMinedAt,
      },
    ])
    expect(result[0]?.hash).toEqual(expectedExit.hash)
  })
  it('finds exit by data for finalize', async () => {
    const starkKey = StarkKey.fake()
    const expectedMinedAt = fakeTimestamp()

    const stateUpdateAt = fakeTimestamp()
    const earlierStateAt = Timestamp(Number(stateUpdateAt) - 100)
    const laterStateAt = Timestamp(Number(stateUpdateAt) + 100)
    const stateUpdateId = fakeInt()

    const exit1 = fakeExit()
    const expectedExit = fakeExit({
      data: fakeWithdrawal({ starkKey }),
    })
    const exit3 = fakeExit()

    await repository.add(exit1, null, fakeTimestamp(), 0)
    await repository.add(expectedExit, null, expectedMinedAt, 0)
    await repository.add(exit3, null, fakeTimestamp(), 0)

    const stateUpdateRepo = new StateUpdateRepository(database, Logger.SILENT)
    await stateUpdateRepo.add({
      stateUpdate: fakeStateUpdate({
        timestamp: earlierStateAt,
      }),
      positions: [],
      prices: [],
      transactionHashes: [exit1.hash],
    })
    await stateUpdateRepo.add({
      stateUpdate: fakeStateUpdate({
        timestamp: stateUpdateAt,
        id: stateUpdateId,
      }),
      positions: [],
      prices: [],
      transactionHashes: [expectedExit.hash],
    })
    await stateUpdateRepo.add({
      stateUpdate: fakeStateUpdate({
        timestamp: laterStateAt,
      }),
      positions: [],
      prices: [],
      transactionHashes: [exit3.hash],
    })

    const result = await repository.getWithdrawalsForFinalize(
      starkKey,
      Timestamp(MAX_TIME),
      Timestamp(0)
    )

    expect(result).toEqual([
      {
        ...expectedExit,
        updates: {
          finalized: undefined,
          sentAt: null,
          forgottenAt: null,
          revertedAt: null,
          minedAt: expectedMinedAt,
          verified: {
            at: stateUpdateAt,
            stateUpdateId,
          },
        },
        lastUpdateAt:
          Number(stateUpdateAt) > Number(expectedMinedAt)
            ? stateUpdateAt
            : expectedMinedAt,
      },
    ])
  })

  it('ignores finalized transaction', async () => {
    const finalizeMinedAt = fakeTimestamp()
    const exitMinedAt = fakeTimestamp(Number(finalizeMinedAt))
    const starkKey = StarkKey.fake()

    const exit = fakeExit({ data: fakeWithdrawal({ starkKey }) })
    const finalize = Hash256.fake()

    await repository.add(exit, null, exitMinedAt, 0)

    const stateUpdateRepo = new StateUpdateRepository(database, Logger.SILENT)
    await stateUpdateRepo.add({
      stateUpdate: fakeStateUpdate(),
      positions: [],
      prices: [],
      transactionHashes: [exit.hash],
    })
    const beforeFinalize = await repository.getWithdrawalsForFinalize(
      starkKey,
      Timestamp(MAX_TIME),
      Timestamp(0)
    )

    await repository.saveFinalize(
      exit.hash,
      finalize,
      null,
      finalizeMinedAt,
      fakeInt()
    )
    const afterFinalize = await repository.getWithdrawalsForFinalize(
      starkKey,
      Timestamp(Number(exitMinedAt) + 1),
      Timestamp(0)
    )

    expect(beforeFinalize[0]?.hash).toEqual(exit.hash)
    expect(afterFinalize).toEqual([])
  })

  it('finds latest finalize timestamp', async () => {
    const finalizeMinedAt = fakeTimestamp()
    const exitMinedAt = fakeTimestamp(Number(finalizeMinedAt))
    const starkKey = StarkKey.fake()

    const exit = fakeExit({ data: fakeWithdrawal({ starkKey }) })
    const finalize = Hash256.fake()

    await repository.add(exit, null, exitMinedAt, 0)

    const stateUpdateRepo = new StateUpdateRepository(database, Logger.SILENT)
    await stateUpdateRepo.add({
      stateUpdate: fakeStateUpdate(),
      positions: [],
      prices: [],
      transactionHashes: [exit.hash],
    })

    await repository.saveFinalize(
      exit.hash,
      finalize,
      null,
      finalizeMinedAt,
      fakeInt()
    )
    const result = await repository.findLatestFinalize()

    expect(result).toEqual(finalizeMinedAt)
  })
})
