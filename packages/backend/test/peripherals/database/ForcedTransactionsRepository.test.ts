import { ForcedTrade, ForcedWithdrawal } from '@explorer/encoding'
import { AssetId, Hash256, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import {
  ForcedTransactionRecord,
  ForcedTransactionsRepository,
} from '../../../src/peripherals/database/ForcedTransactionsRepository'
import { Logger } from '../../../src/tools/Logger'
import { fakeBigInt, fakeBoolean, fakeInt, fakeTimestamp } from '../../utils'
import { setupDatabaseTestSuite } from './setup'

function fakeWithdrawal(
  withdrawal?: Partial<Omit<ForcedWithdrawal, 'type'>>
): ForcedWithdrawal {
  return {
    type: 'withdrawal',
    publicKey: StarkKey.fake(),
    positionId: fakeBigInt(),
    amount: fakeBigInt(),
    ...withdrawal,
  }
}

function fakeTrade(trade?: Partial<Omit<ForcedTrade, 'type'>>): ForcedTrade {
  return {
    type: 'trade',
    collateralAmount: fakeBigInt(),
    isABuyingSynthetic: fakeBoolean(),
    nonce: fakeBigInt(),
    positionIdA: fakeBigInt(),
    positionIdB: fakeBigInt(),
    publicKeyA: StarkKey.fake(),
    publicKeyB: StarkKey.fake(),
    syntheticAmount: fakeBigInt(),
    syntheticAssetId: AssetId.USDC,
    ...trade,
  }
}

function updates(
  updates?: Partial<ForcedTransactionRecord['updates']>
): ForcedTransactionRecord['updates'] {
  return {
    forgottenAt: null,
    minedAt: null,
    revertedAt: null,
    sentAt: null,
    verified: undefined,
    ...updates,
  }
}

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
    const sentAt4 = fakeTimestamp(1)
    const minedAt4 = fakeTimestamp(2)
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
        updates: updates({
          sentAt: sentAt1,
        }),
      },
      {
        ...tx2,
        lastUpdateAt: sentAt2,
        updates: updates({
          sentAt: sentAt2,
        }),
      },
      {
        ...tx3,
        lastUpdateAt: minedAt3,
        updates: updates({
          sentAt: sentAt3,
          minedAt: minedAt3,
        }),
      },
      {
        ...tx4,
        lastUpdateAt: minedAt4,
        updates: updates({
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
    const sentAt1 = fakeTimestamp(1)
    const hash2 = Hash256.fake()
    const data2 = fakeTrade()
    const sentAt2 = fakeTimestamp(2)
    const minedAt2 = fakeTimestamp(3)
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

    const latest = await repository.getLatest({ limit: 10, offset: 0 })

    expect(latest).toEqual([
      {
        hash: hash1,
        data: data1,
        lastUpdateAt: sentAt1,
        updates: updates({
          sentAt: sentAt1,
        }),
      },
      {
        hash: hash2,
        data: data2,
        lastUpdateAt: minedAt2,
        updates: updates({
          sentAt: sentAt2,
          minedAt: minedAt2,
        }),
      },
    ])

    const offset = await repository.getLatest({ limit: 10, offset: 2 })
    expect(offset).toEqual([])
  })

  it('returns transactions affecting position', async () => {
    const positionId = fakeBigInt()
    const hash1 = Hash256.fake()
    const data1 = fakeWithdrawal({ positionId })
    const sentAt1 = fakeTimestamp()
    const hash2 = Hash256.fake()
    const data2 = fakeTrade({ positionIdA: positionId })
    const sentAt2 = fakeTimestamp(1)
    const minedAt2 = fakeTimestamp(2)
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
        updates: updates({
          sentAt: sentAt1,
        }),
      },
      {
        hash: hash2,
        data: data2,
        lastUpdateAt: minedAt2,
        updates: updates({
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
    const sentAt2 = fakeTimestamp(1)
    const minedAt2 = fakeTimestamp(2)
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
      updates: updates({ sentAt }),
    })
  })
})
