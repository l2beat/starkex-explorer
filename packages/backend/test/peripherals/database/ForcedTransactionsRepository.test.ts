import { AssetId, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { ForcedTransactionsRepository } from '../../../src/peripherals/database/ForcedTransactionsRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(ForcedTransactionsRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new ForcedTransactionsRepository(knex, Logger.SILENT)

  beforeEach(() => repository.deleteAll())

  it('adds single event', async () => {
    const record = {
      transactionType: 'withdrawal' as const,
      eventType: 'mined' as const,
      amount: 123n,
      blockNumber: 1,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
      timestamp: Timestamp(0),
      transactionHash: Hash256.fake(),
    }
    await repository.addEvents([record])

    const actual = await repository.getAllEvents()

    expect(actual).toEqual([
      {
        ...record,
        id: expect.a(Number),
      },
    ])
  })

  it('adds events with ids', async () => {
    const transactionHash = Hash256.fake()
    const events = [
      {
        id: 1,
        transactionType: 'withdrawal' as const,
        eventType: 'mined' as const,
        amount: 123n,
        blockNumber: 1,
        positionId: 123n,
        publicKey: StarkKey.fake('123'),
        timestamp: Timestamp(0),
        transactionHash,
      },
      {
        id: 2,
        transactionType: 'withdrawal' as const,
        eventType: 'verified' as const,
        timestamp: Timestamp(0),
        transactionHash,
        blockNumber: 1,
        stateUpdateId: 2,
      },
    ]

    await repository.addEvents(events)

    const actual = await repository.getAllEvents()

    expect(actual).toEqual(events)
  })

  it('returns no transaction hashes if no data passed', async () => {
    const hashes = await repository.getTransactionHashesByMinedEventsData([])
    expect(hashes).toEqual([])
  })

  it('returns transaction hashes only for unverified transactions', async () => {
    const hash1 = Hash256.fake()
    const data = {
      publicKeyA: StarkKey.fake('123a'),
      publicKeyB: StarkKey.fake('123b'),
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
      nonce: 1n,
    }
    const hash2 = Hash256.fake()

    const events = [
      {
        id: 1,
        transactionType: 'trade' as const,
        eventType: 'mined' as const,
        timestamp: Timestamp(1),
        transactionHash: hash1,
        blockNumber: 1,
        ...data,
      },
      {
        id: 2,
        transactionType: 'trade' as const,
        eventType: 'mined' as const,
        timestamp: Timestamp(2),
        transactionHash: hash2,
        blockNumber: 1,
        ...data,
      },
    ]

    await repository.addEvents(events)

    const hashes1 = await repository.getTransactionHashesByMinedEventsData([
      data,
    ])

    expect(hashes1).toEqual([hash1])

    await repository.addEvents([
      {
        id: 3,
        transactionType: 'trade',
        eventType: 'verified',
        timestamp: Timestamp(3),
        transactionHash: hash1,
        blockNumber: 1,
        stateUpdateId: 1,
      },
    ])

    const hashes2 = await repository.getTransactionHashesByMinedEventsData([
      data,
    ])

    expect(hashes2).toEqual([hash2])
  })

  it('returns transaction hashes', async () => {
    const hash1 = Hash256.fake()
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
    }

    const hash2 = Hash256.fake()
    const data2 = {
      publicKeyA: StarkKey.fake('123a'),
      publicKeyB: StarkKey.fake('123b'),
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
      nonce: 1n,
    }

    const events = [
      {
        id: 1,
        transactionType: 'withdrawal' as const,
        eventType: 'mined' as const,
        blockNumber: 1,
        timestamp: Timestamp(0),
        transactionHash: hash1,
        ...data1,
      },
      {
        id: 2,
        transactionType: 'trade' as const,
        eventType: 'mined' as const,
        timestamp: Timestamp(1),
        transactionHash: hash2,
        blockNumber: 1,
        ...data2,
      },
    ]

    await repository.addEvents(events)

    const hashes = await repository.getTransactionHashesByMinedEventsData([
      { positionId: 123n, amount: 123n, publicKey: StarkKey.fake('123') },
      data2,
      { ...data2, publicKeyA: StarkKey.fake() },
    ])

    expect(hashes).toEqual([hash1, hash2, undefined])
  })

  it('returns latest transactions', async () => {
    const hash1 = Hash256.fake()
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
    }

    const hash2 = Hash256.fake()
    const data2 = {
      publicKeyA: StarkKey.fake('123a'),
      publicKeyB: StarkKey.fake('123b'),
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
      nonce: 1n,
    }

    const events = [
      {
        transactionType: 'withdrawal' as const,
        eventType: 'mined' as const,
        blockNumber: 1,
        timestamp: Timestamp(0),
        transactionHash: hash1,
        ...data1,
      },
      {
        transactionType: 'withdrawal' as const,
        eventType: 'verified' as const,
        blockNumber: 1,
        timestamp: Timestamp(1),
        transactionHash: hash1,
        stateUpdateId: 1,
      },
      {
        transactionType: 'trade' as const,
        eventType: 'mined' as const,
        timestamp: Timestamp(2),
        transactionHash: hash2,
        blockNumber: 1,
        ...data2,
      },
    ]

    await repository.addEvents(events)

    const latest = await repository.getLatest({ limit: 10, offset: 0 })

    expect(latest).toEqual([
      {
        hash: hash2,
        type: 'trade',
        status: 'mined',
        lastUpdate: Timestamp(2),
        collateralAmount: 789n,
        isABuyingSynthetic: true,
        positionIdA: 456n,
        positionIdB: 789n,
        publicKeyA: StarkKey.fake('123a'),
        publicKeyB: StarkKey.fake('123b'),
        syntheticAmount: 456n,
        syntheticAssetId: AssetId('ETH-7'),
      },
      {
        hash: hash1,
        type: 'withdrawal',
        status: 'verified',
        lastUpdate: Timestamp(1),
        amount: 123n,
        positionId: 123n,
        publicKey: StarkKey.fake('123'),
        stateUpdateId: 1,
      },
    ])
    const offset = await repository.getLatest({ limit: 10, offset: 2 })
    expect(offset).toEqual([])
  })

  it('returns transactions included in a state update', async () => {
    const hash1 = Hash256.fake()
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
    }

    const hash2 = Hash256.fake()
    const data2 = {
      publicKeyA: StarkKey.fake('123a'),
      publicKeyB: StarkKey.fake('123b'),
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
      nonce: 1n,
    }

    const events = [
      {
        transactionType: 'withdrawal' as const,
        eventType: 'mined' as const,
        blockNumber: 1,
        timestamp: Timestamp(0),
        transactionHash: hash1,
        ...data1,
      },
      {
        transactionType: 'withdrawal' as const,
        eventType: 'verified' as const,
        blockNumber: 1,
        timestamp: Timestamp(1),
        transactionHash: hash1,
        stateUpdateId: 1,
      },
      {
        transactionType: 'trade' as const,
        eventType: 'mined' as const,
        timestamp: Timestamp(2),
        transactionHash: hash2,
        blockNumber: 1,
        ...data2,
      },
    ]

    await repository.addEvents(events)

    const transactions = await repository.getIncludedInStateUpdate(1)
    expect(transactions).toEqual([
      {
        amount: 123n,
        hash: hash1,
        lastUpdate: Timestamp(1),
        positionId: 123n,
        publicKey: StarkKey.fake('123'),
        stateUpdateId: 1,
        status: 'verified',
        type: 'withdrawal',
      },
    ])
  })

  it('returns transactions affecting position', async () => {
    const hash1 = Hash256.fake()
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
    }

    const hash2 = Hash256.fake()
    const data2 = {
      publicKeyA: StarkKey.fake('123a'),
      publicKeyB: StarkKey.fake('123b'),
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
      nonce: 1n,
    }

    const events = [
      {
        transactionType: 'withdrawal' as const,
        eventType: 'mined' as const,
        blockNumber: 1,
        timestamp: Timestamp(0),
        transactionHash: hash1,
        ...data1,
      },
      {
        transactionType: 'withdrawal' as const,
        eventType: 'verified' as const,
        blockNumber: 1,
        timestamp: Timestamp(1),
        transactionHash: hash1,
        stateUpdateId: 1,
      },
      {
        transactionType: 'trade' as const,
        eventType: 'mined' as const,
        timestamp: Timestamp(2),
        transactionHash: hash2,
        blockNumber: 1,
        ...data2,
      },
    ]

    await repository.addEvents(events)

    const transactions = await repository.getAffectingPosition(123n)
    expect(transactions).toEqual([
      {
        amount: 123n,
        hash: hash1,
        lastUpdate: Timestamp(1),
        positionId: 123n,
        publicKey: StarkKey.fake('123'),
        stateUpdateId: 1,
        status: 'verified',
        type: 'withdrawal',
      },
    ])

    const unknownPositionTransactions = await repository.getAffectingPosition(
      999n
    )
    expect(unknownPositionTransactions).toEqual([])
  })

  it('counts all transactions', async () => {
    const hash1 = Hash256.fake()
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
    }

    const hash2 = Hash256.fake()
    const data2 = {
      publicKeyA: StarkKey.fake('123a'),
      publicKeyB: StarkKey.fake('123b'),
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
      nonce: 1n,
    }

    const events = [
      {
        transactionType: 'withdrawal' as const,
        eventType: 'mined' as const,
        blockNumber: 1,
        timestamp: Timestamp(0),
        transactionHash: hash1,
        ...data1,
      },
      {
        transactionType: 'withdrawal' as const,
        eventType: 'verified' as const,
        blockNumber: 1,
        timestamp: Timestamp(1),
        transactionHash: hash1,
        stateUpdateId: 1,
      },
      {
        transactionType: 'trade' as const,
        eventType: 'mined' as const,
        timestamp: Timestamp(2),
        transactionHash: hash2,
        blockNumber: 1,
        ...data2,
      },
    ]

    await repository.addEvents(events)

    const count = await repository.countAll()

    expect(count).toEqual(2n)
  })

  it('returns undefined if transaction not found by hash', async () => {
    const result = await repository.getByHashWithEvents(Hash256.fake())
    expect(result).not.toBeDefined()
  })

  it('returns transaction with events by hash', async () => {
    const hash1 = Hash256.fake()
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
    }

    const hash2 = Hash256.fake()
    const data2 = {
      publicKeyA: StarkKey.fake('123a'),
      publicKeyB: StarkKey.fake('123b'),
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
      nonce: 1n,
    }
    const stateUpdateId = 1

    const events = [
      {
        id: 1,
        transactionType: 'withdrawal' as const,
        eventType: 'mined' as const,
        blockNumber: 1,
        timestamp: Timestamp(0),
        transactionHash: hash1,
        ...data1,
      },
      {
        id: 2,
        transactionType: 'withdrawal' as const,
        eventType: 'verified' as const,
        blockNumber: 1,
        timestamp: Timestamp(1),
        transactionHash: hash1,
        stateUpdateId,
      },
      {
        id: 3,
        transactionType: 'trade' as const,
        eventType: 'mined' as const,
        timestamp: Timestamp(2),
        transactionHash: hash2,
        blockNumber: 1,
        ...data2,
      },
    ]

    await repository.addEvents(events)

    const result = await repository.getByHashWithEvents(hash1)

    expect(result?.events).toEqual(events.slice(0, 2))
    expect(result?.transaction).toEqual({
      type: 'withdrawal',
      status: 'verified',
      ...data1,
      hash: hash1,
      stateUpdateId,
      lastUpdate: events[1].timestamp,
    })
  })
})
