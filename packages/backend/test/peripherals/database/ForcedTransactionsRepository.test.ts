import { AssetId, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { ForcedTransactionsRepository } from '../../../src/peripherals/database/ForcedTransactionsRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(ForcedTransactionsRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new ForcedTransactionsRepository(knex, Logger.SILENT)

  beforeEach(() => repository.deleteAll())

  it('adds sent transaction', async () => {
    const withdrawal = {
      hash: Hash256.fake(),
      type: 'withdrawal' as const,
      sentAt: Timestamp(1),
      amount: 123n,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
    }
    const trade = {
      hash: Hash256.fake(),
      type: 'trade' as const,
      sentAt: Timestamp(2),
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

    await repository.addSent(withdrawal)
    await repository.addSent(trade)

    const actual = await repository.getAll()

    expect(actual).toEqual([
      {
        ...withdrawal,
        status: 'sent',
        lastUpdate: Timestamp(1),
      },
      {
        ...trade,
        status: 'sent',
        lastUpdate: Timestamp(2),
      },
    ])
  })

  it('adds mined transaction', async () => {
    const withdrawal = {
      hash: Hash256.fake(),
      type: 'withdrawal' as const,
      minedAt: Timestamp(1),
      amount: 123n,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
    }
    const trade = {
      hash: Hash256.fake(),
      type: 'trade' as const,
      minedAt: Timestamp(2),
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

    await repository.addMined({ ...withdrawal, blockNumber: 1 })
    await repository.addMined({ ...trade, blockNumber: 1 })

    const actual = await repository.getAll()

    expect(actual).toEqual([
      {
        ...withdrawal,
        status: 'mined',
        lastUpdate: Timestamp(1),
        sentAt: undefined,
      },
      {
        ...trade,
        status: 'mined',
        lastUpdate: Timestamp(2),
        sentAt: undefined,
      },
    ])
  })

  it('returns no transaction hashes if no data passed', async () => {
    const hashes = await repository.getTransactionHashesByData([])
    expect(hashes).toEqual([])
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

    await repository.addMined({
      hash: hash1,
      type: 'withdrawal' as const,
      ...data1,
      minedAt: Timestamp(1),
      blockNumber: 1,
    })
    await repository.addMined({
      hash: hash2,
      type: 'trade' as const,
      ...data2,
      minedAt: Timestamp(2),
      blockNumber: 2,
    })

    const hashes = await repository.getTransactionHashesByData([
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

    await repository.addSent({
      hash: hash1,
      type: 'withdrawal' as const,
      ...data1,
      sentAt: Timestamp(1),
    })
    await repository.addMined({
      hash: hash2,
      type: 'trade' as const,
      ...data2,
      minedAt: Timestamp(2),
      blockNumber: 2,
    })

    const latest = await repository.getLatest({ limit: 10, offset: 0 })

    expect(latest).toEqual([
      {
        ...data1,
        hash: hash1,
        type: 'withdrawal' as const,
        status: 'sent',
        lastUpdate: Timestamp(1),
        sentAt: Timestamp(1),
      },
      {
        ...data2,
        hash: hash2,
        type: 'trade' as const,
        status: 'mined',
        lastUpdate: Timestamp(2),
        sentAt: undefined,
        minedAt: Timestamp(2),
      },
    ])
    const offset = await repository.getLatest({ limit: 10, offset: 2 })
    expect(offset).toEqual([])
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
      positionIdA: 123n,
      positionIdB: 789n,
      syntheticAssetId: AssetId('ETH-7'),
      isABuyingSynthetic: true,
      syntheticAmount: 456n,
      collateralAmount: 789n,
      nonce: 1n,
    }

    const hash3 = Hash256.fake()
    const data3 = {
      amount: 123n,
      positionId: 297n,
      publicKey: StarkKey.fake('123'),
    }

    await repository.addSent({
      hash: hash1,
      type: 'withdrawal' as const,
      ...data1,
      sentAt: Timestamp(1),
    })
    await repository.addMined({
      hash: hash2,
      type: 'trade' as const,
      ...data2,
      minedAt: Timestamp(2),
      blockNumber: 2,
    })
    await repository.addSent({
      hash: hash3,
      type: 'withdrawal' as const,
      ...data3,
      sentAt: Timestamp(3),
    })

    const transactions = await repository.getAffectingPosition(123n)
    expect(transactions).toEqual([
      {
        type: 'withdrawal',
        ...data1,
        hash: hash1,
        status: 'sent',
        sentAt: Timestamp(1),
        lastUpdate: Timestamp(1),
      },
      {
        type: 'trade',
        ...data2,
        hash: hash2,
        status: 'mined',
        sentAt: undefined,
        minedAt: Timestamp(2),
        lastUpdate: Timestamp(2),
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

    await repository.addSent({
      hash: hash1,
      type: 'withdrawal' as const,
      ...data1,
      sentAt: Timestamp(1),
    })
    await repository.addMined({
      hash: hash2,
      type: 'trade' as const,
      ...data2,
      minedAt: Timestamp(2),
      blockNumber: 2,
    })

    const count = await repository.countAll()

    expect(count).toEqual(2n)
  })

  it('returns undefined if transaction not found by hash', async () => {
    const transaction = await repository.findByHash(Hash256.fake())
    expect(transaction).not.toBeDefined()
  })

  it('gets by hash', async () => {
    const withdrawal = {
      hash: Hash256.fake(),
      type: 'withdrawal' as const,
      sentAt: Timestamp(1),
      amount: 123n,
      positionId: 123n,
      publicKey: StarkKey.fake('123'),
    }
    await repository.addSent(withdrawal)
    const transaction = await repository.findByHash(withdrawal.hash)
    expect(transaction).toBeDefined()
  })
})
