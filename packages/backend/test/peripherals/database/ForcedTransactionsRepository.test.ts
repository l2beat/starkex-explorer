import { AssetId, Timestamp } from '@explorer/types'
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
      publicKey: '123',
      timestamp: Timestamp(0),
      transactionHash: '123',
    }
    await repository.addEvents([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([
      {
        ...record,
        id: expect.a(Number),
      },
    ])
  })

  it('adds events with ids', async () => {
    const events = [
      {
        id: 1,
        transactionType: 'withdrawal' as const,
        eventType: 'mined' as const,
        amount: 123n,
        blockNumber: 1,
        positionId: 123n,
        publicKey: '123',
        timestamp: Timestamp(0),
        transactionHash: '123',
      },
      {
        id: 2,
        transactionType: 'withdrawal' as const,
        eventType: 'verified' as const,
        timestamp: Timestamp(0),
        transactionHash: '123',
        blockNumber: 1,
        stateUpdateId: 2,
      },
    ]

    await repository.addEvents(events)

    const actual = await repository.getAll()

    expect(actual).toEqual(events)
  })

  it('returns no transaction hashes if no data passed', async () => {
    const hashes = await repository.getTransactionHashesByMinedEventsData([])
    expect(hashes).toEqual([])
  })

  it('returns transaction hashes', async () => {
    const hash1 = '123'
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: '123',
    }

    const hash2 = '456'
    const data2 = {
      publicKeyA: '123a',
      publicKeyB: '123b',
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
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
      data1,
      data2,
      { ...data2, publicKeyA: 'something' },
    ])

    expect(hashes).toEqual([hash1, hash2, undefined])
  })

  it('returns latest transactions', async () => {
    const hash1 = '123'
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: '123',
    }

    const hash2 = '456'
    const data2 = {
      publicKeyA: '123a',
      publicKeyB: '123b',
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
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

    const latest = await repository.getLatest(10)

    expect(latest).toEqual([
      {
        hash: '456',
        type: 'trade',
        status: 'mined',
        lastUpdate: Timestamp(2),
        collateralAmount: 789n,
        isABuyingSynthetic: true,
        positionIdA: 456n,
        positionIdB: 789n,
        publicKeyA: '123a',
        publicKeyB: '123b',
        syntheticAmount: 456n,
        syntheticAssetId: AssetId('ETH-7'),
      },
      {
        hash: '123',
        type: 'withdrawal',
        status: 'verified',
        lastUpdate: Timestamp(1),
        amount: 123n,
        positionId: 123n,
        publicKey: '123',
        stateUpdateId: 1,
      },
    ])
    const offset = await repository.getLatest(10, 2)
    expect(offset).toEqual([])
  })

  it('returns transactions included in a state update', async () => {
    const hash1 = '123'
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: '123',
    }

    const hash2 = '456'
    const data2 = {
      publicKeyA: '123a',
      publicKeyB: '123b',
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
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
        hash: '123',
        lastUpdate: Timestamp(1),
        positionId: 123n,
        publicKey: '123',
        stateUpdateId: 1,
        status: 'verified',
        type: 'withdrawal',
      },
    ])
  })

  it('returns transactions affecting position', async () => {
    const hash1 = '123'
    const data1 = {
      amount: 123n,
      positionId: 123n,
      publicKey: '123',
    }

    const hash2 = '456'
    const data2 = {
      publicKeyA: '123a',
      publicKeyB: '123b',
      positionIdA: 456n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
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
        hash: '123',
        lastUpdate: Timestamp(1),
        positionId: 123n,
        publicKey: '123',
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
})
