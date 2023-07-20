import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect } from 'earl'

import { setupDatabaseTestSuite } from '../../../test/database'
import {
  ForcedTradeData,
  ForcedWithdrawalData,
  WithdrawData,
} from './UserTransaction'
import { UserTransactionRepository } from './UserTransactionRepository'

describe(UserTransactionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new UserTransactionRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  function fakeForcedWithdrawal(
    override?: Partial<ForcedWithdrawalData>
  ): ForcedWithdrawalData {
    return {
      type: 'ForcedWithdrawal',
      positionId: 1n,
      starkKey: StarkKey.fake(),
      quantizedAmount: 123n,
      ...override,
    }
  }

  function fakeForcedTrade(
    override?: Partial<ForcedTradeData>
  ): ForcedTradeData {
    return {
      type: 'ForcedTrade',
      positionIdA: 1n,
      positionIdB: 1n,
      starkKeyA: StarkKey.fake(),
      starkKeyB: StarkKey.fake(),
      collateralAmount: 123n,
      collateralAssetId: AssetId('USDC-6'),
      syntheticAmount: 123n,
      syntheticAssetId: AssetId('ETH-9'),
      isABuyingSynthetic: true,
      nonce: 123n,
      ...override,
    }
  }

  function fakeWithdraw(override?: Partial<WithdrawData>): WithdrawData {
    return {
      type: 'Withdraw',
      assetType: AssetHash('0x1234'),
      nonQuantizedAmount: 123n,
      quantizedAmount: 123n,
      recipient: EthereumAddress.fake(),
      starkKey: StarkKey.fake(),
      ...override,
    }
  }

  describe(UserTransactionRepository.prototype.getByStarkKey.name, () => {
    const starkKey = StarkKey.fake()
    const starkKeyB = StarkKey.fake()
    let id1: number
    let id2: number

    beforeEach(async () => {
      id1 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal({ starkKey }),
      })
      id2 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(456000),
        data: fakeForcedTrade({ starkKeyA: starkKey, starkKeyB }),
      })
      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 789,
        timestamp: Timestamp(789000),
        data: fakeForcedWithdrawal(),
      })
    })

    it('returns the transactions for the given stark key', async () => {
      const records = await repository.getByStarkKey(starkKey)
      expect(records.map((x) => x.id)).toEqual([id2, id1])
    })

    it('can query for stark key b', async () => {
      const records = await repository.getByStarkKey(starkKeyB)
      expect(records.map((x) => x.id)).toEqual([id2])
    })

    it('accepts an optional types parameter', async () => {
      const records1 = await repository.getByStarkKey(starkKey, [
        'ForcedTrade',
        'ForcedWithdrawal',
      ])
      expect(records1.map((x) => x.id)).toEqual([id2, id1])

      const records2 = await repository.getByStarkKey(starkKey, ['ForcedTrade'])
      expect(records2.map((x) => x.id)).toEqual([id2])

      const records3 = await repository.getByStarkKey(starkKey, [
        'ForcedWithdrawal',
      ])
      expect(records3.map((x) => x.id)).toEqual([id1])
    })

    it('accepts an optional pagination parameter', async () => {
      const records1 = await repository.getByStarkKey(
        starkKey,
        ['ForcedTrade', 'ForcedWithdrawal'],
        { offset: 1, limit: 1 }
      )
      expect(records1.map((x) => x.id)).toEqual([id1])

      const records2 = await repository.getByStarkKey(
        starkKey,
        ['ForcedTrade', 'ForcedWithdrawal'],
        { offset: 0, limit: 1 }
      )
      expect(records2.map((x) => x.id)).toEqual([id2])

      const records3 = await repository.getByStarkKey(
        starkKey,
        ['ForcedTrade', 'ForcedWithdrawal'],
        { offset: 0, limit: 2 }
      )
      expect(records3.map((x) => x.id)).toEqual([id2, id1])
    })
  })

  describe(UserTransactionRepository.prototype.getByPositionId.name, () => {
    const positionId = 1234n
    const positionIdB = 5678n
    let id1: number
    let id2: number

    beforeEach(async () => {
      id1 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal({ positionId }),
      })
      id2 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(456000),
        data: fakeForcedTrade({ positionIdA: positionId, positionIdB }),
      })
      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 789,
        timestamp: Timestamp(789000),
        data: fakeForcedWithdrawal(),
      })
    })

    it('returns the transactions for the given position id', async () => {
      const records = await repository.getByPositionId(positionId)
      expect(records.map((x) => x.id)).toEqual([id2, id1])
    })

    it('can query for position id b', async () => {
      const records = await repository.getByPositionId(positionIdB)
      expect(records.map((x) => x.id)).toEqual([id2])
    })

    it('accepts an optional types parameter', async () => {
      const records1 = await repository.getByPositionId(positionId, [
        'ForcedTrade',
        'ForcedWithdrawal',
      ])
      expect(records1.map((x) => x.id)).toEqual([id2, id1])

      const records2 = await repository.getByPositionId(positionId, [
        'ForcedTrade',
      ])
      expect(records2.map((x) => x.id)).toEqual([id2])

      const records3 = await repository.getByPositionId(positionId, [
        'ForcedWithdrawal',
      ])
      expect(records3.map((x) => x.id)).toEqual([id1])
    })
  })

  describe(UserTransactionRepository.prototype.getByStateUpdateId.name, () => {
    let id1: number
    let id2: number

    beforeEach(async () => {
      const transactionHash1 = Hash256.fake()
      id1 = await repository.add({
        transactionHash: transactionHash1,
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal(),
      })
      const transactionHash2 = Hash256.fake()
      id2 = await repository.add({
        transactionHash: transactionHash2,
        blockNumber: 456,
        timestamp: Timestamp(456000),
        data: fakeForcedTrade(),
      })
      const transactionHash3 = Hash256.fake()
      await repository.add({
        transactionHash: transactionHash3,
        blockNumber: 789,
        timestamp: Timestamp(789000),
        data: fakeForcedWithdrawal(),
      })
      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 999,
        timestamp: Timestamp(999000),
        data: fakeForcedWithdrawal(),
      })

      await repository.addManyIncluded([
        {
          transactionHash: transactionHash1,
          blockNumber: 123,
          timestamp: Timestamp(123000),
          stateUpdateId: 1,
        },
        {
          transactionHash: transactionHash2,
          blockNumber: 456,
          timestamp: Timestamp(456000),
          stateUpdateId: 1,
        },
        {
          transactionHash: transactionHash3,
          blockNumber: 789,
          timestamp: Timestamp(789000),
          stateUpdateId: 2,
        },
      ])
    })

    it('returns the transactions for the given state update id', async () => {
      const records = await repository.getByStateUpdateId(1)
      expect(records.map((x) => x.id)).toEqual([id2, id1])
    })

    it('accepts an optional types parameter', async () => {
      const records1 = await repository.getByStateUpdateId(1, [
        'ForcedTrade',
        'ForcedWithdrawal',
      ])
      expect(records1.map((x) => x.id)).toEqual([id2, id1])

      const records2 = await repository.getByStateUpdateId(1, ['ForcedTrade'])
      expect(records2.map((x) => x.id)).toEqual([id2])

      const records3 = await repository.getByStateUpdateId(1, [
        'ForcedWithdrawal',
      ])
      expect(records3.map((x) => x.id)).toEqual([id1])
    })
  })

  describe(
    UserTransactionRepository.prototype.getByStateUpdateIdAndPositionId.name,
    () => {
      const positionId = 1234n
      const positionIdB = 5678n
      let id1: number
      let id2: number

      beforeEach(async () => {
        const transactionHash1 = Hash256.fake()
        id1 = await repository.add({
          transactionHash: transactionHash1,
          blockNumber: 123,
          timestamp: Timestamp(123000),
          data: fakeForcedWithdrawal({ positionId }),
        })
        const transactionHash2 = Hash256.fake()
        id2 = await repository.add({
          transactionHash: transactionHash2,
          blockNumber: 456,
          timestamp: Timestamp(456000),
          data: fakeForcedTrade({ positionIdA: positionId, positionIdB }),
        })
        const transactionHash3 = Hash256.fake()
        await repository.add({
          transactionHash: transactionHash3,
          blockNumber: 789,
          timestamp: Timestamp(789000),
          data: fakeForcedWithdrawal(),
        })
        const transactionHash4 = Hash256.fake()
        await repository.add({
          transactionHash: transactionHash4,
          blockNumber: 888,
          timestamp: Timestamp(888000),
          data: fakeForcedWithdrawal(),
        })
        await repository.add({
          transactionHash: Hash256.fake(),
          blockNumber: 999,
          timestamp: Timestamp(999000),
          data: fakeForcedWithdrawal(),
        })

        await repository.addManyIncluded([
          {
            transactionHash: transactionHash1,
            blockNumber: 123,
            timestamp: Timestamp(123000),
            stateUpdateId: 1,
          },
          {
            transactionHash: transactionHash2,
            blockNumber: 456,
            timestamp: Timestamp(456000),
            stateUpdateId: 1,
          },
          {
            transactionHash: transactionHash3,
            blockNumber: 789,
            timestamp: Timestamp(789000),
            stateUpdateId: 1,
          },
          {
            transactionHash: transactionHash4,
            blockNumber: 888,
            timestamp: Timestamp(888000),
            stateUpdateId: 2,
          },
        ])
      })

      it('returns the specified transactions', async () => {
        const records = await repository.getByStateUpdateIdAndPositionId(
          1,
          positionId
        )
        expect(records.map((x) => x.id)).toEqual([id2, id1])
      })

      it('can query for position id b', async () => {
        const records = await repository.getByStateUpdateIdAndPositionId(
          1,
          positionIdB
        )
        expect(records.map((x) => x.id)).toEqual([id2])
      })

      it('accepts an optional types parameter', async () => {
        const records1 = await repository.getByStateUpdateIdAndPositionId(
          1,
          positionId,
          ['ForcedTrade', 'ForcedWithdrawal']
        )
        expect(records1.map((x) => x.id)).toEqual([id2, id1])

        const records2 = await repository.getByStateUpdateIdAndPositionId(
          1,
          positionId,
          ['ForcedTrade']
        )
        expect(records2.map((x) => x.id)).toEqual([id2])

        const records3 = await repository.getByStateUpdateIdAndPositionId(
          1,
          positionId,
          ['ForcedWithdrawal']
        )
        expect(records3.map((x) => x.id)).toEqual([id1])
      })
    }
  )

  describe(UserTransactionRepository.prototype.getPaginated.name, () => {
    it('respects the limit parameter', async () => {
      const ids = []
      for (let i = 0; i < 10; i++) {
        ids.push(
          await repository.add({
            transactionHash: Hash256.fake(),
            blockNumber: 123,
            timestamp: Timestamp(123000 - i),
            data: fakeForcedWithdrawal(),
          })
        )
      }
      const records = await repository.getPaginated({ limit: 5, offset: 0 })
      expect(records.map((x) => x.id)).toEqual(ids.slice(0, 5))
    })

    it('respects the offset parameter', async () => {
      const ids = []
      for (let i = 0; i < 10; i++) {
        ids.push(
          await repository.add({
            transactionHash: Hash256.fake(),
            blockNumber: 123,
            timestamp: Timestamp(123000 - i),
            data: fakeForcedWithdrawal(),
          })
        )
      }
      const records = await repository.getPaginated({ limit: 5, offset: 2 })
      expect(records.map((x) => x.id)).toEqual(ids.slice(2, 5 + 2))
    })

    it('respects the type parameter', async () => {
      const ids = []
      for (let i = 0; i < 20; i++) {
        ids.push(
          await repository.add({
            transactionHash: Hash256.fake(),
            blockNumber: 123,
            timestamp: Timestamp(123000 - i),
            data: i < 10 ? fakeForcedTrade() : fakeForcedWithdrawal(),
          })
        )
      }
      const records1 = await repository.getPaginated({
        limit: 5,
        offset: 0,
        types: ['ForcedWithdrawal'],
      })
      expect(records1.map((x) => x.id)).toEqual(ids.slice(10, 15))

      const records2 = await repository.getPaginated({
        limit: 5,
        offset: 0,
        types: ['ForcedTrade'],
      })
      expect(records2.map((x) => x.id)).toEqual(ids.slice(0, 5))
    })
  })

  describe(UserTransactionRepository.prototype.getNotIncluded.name, () => {
    let id1: number
    let id2: number

    beforeEach(async () => {
      const transactionHash = Hash256.fake()
      await repository.add({
        transactionHash,
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal(),
      })
      await repository.addManyIncluded([
        {
          transactionHash,
          blockNumber: 123,
          timestamp: Timestamp(123000),
          stateUpdateId: 123,
        },
      ])

      id1 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(456000),
        data: fakeForcedWithdrawal(),
      })

      id2 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 789,
        timestamp: Timestamp(789000),
        data: fakeForcedTrade(),
      })
    })

    it('returns the transactions that have not been included', async () => {
      const result = await repository.getNotIncluded()
      expect(result.map((x) => x.id)).toEqual([id1, id2])
    })

    it('accepts an optional type parameter', async () => {
      const result1 = await repository.getNotIncluded([
        'ForcedTrade',
        'ForcedWithdrawal',
      ])
      expect(result1.map((x) => x.id)).toEqual([id1, id2])

      const result2 = await repository.getNotIncluded(['ForcedWithdrawal'])
      expect(result2.map((x) => x.id)).toEqual([id1])

      const result3 = await repository.getNotIncluded(['ForcedTrade'])
      expect(result3.map((x) => x.id)).toEqual([id2])
    })
  })

  describe(
    UserTransactionRepository.prototype.getCountOfIncludedByStateUpdateId.name,
    () => {
      it('returns the number of forced transactions included in state update', async () => {
        const transactionHash = Hash256.fake()
        await repository.add({
          transactionHash,
          blockNumber: 123,
          timestamp: Timestamp(123000),
          data: fakeForcedWithdrawal(),
        })
        await repository.addManyIncluded([
          {
            transactionHash,
            blockNumber: 123,
            timestamp: Timestamp(123000),
            stateUpdateId: 123,
          },
        ])

        // To be ignored (not included)
        await repository.add({
          transactionHash: Hash256.fake(),
          blockNumber: 456,
          timestamp: Timestamp(123000),
          data: fakeForcedWithdrawal(),
        })

        // To be ignored (wrong state update id)
        await repository.add({
          transactionHash: Hash256.fake('aa11'),
          blockNumber: 234,
          timestamp: Timestamp(123000),
          data: fakeForcedWithdrawal(),
        })
        await repository.addManyIncluded([
          {
            transactionHash: Hash256.fake('aa11'),
            blockNumber: 234,
            timestamp: Timestamp(123000),
            stateUpdateId: 789,
          },
        ])

        expect(await repository.getCountOfIncludedByStateUpdateId(123)).toEqual(
          1
        )
      })
    }
  )

  describe(UserTransactionRepository.prototype.getCountByStarkKey.name, () => {
    it('returns 0 for an empty database', async () => {
      expect(await repository.getCountByStarkKey(StarkKey.fake())).toEqual(0)
    })

    it('returns the number of transactions', async () => {
      const transactionHash = Hash256.fake()
      const starkKey = StarkKey.fake('00fa')
      await repository.add({
        transactionHash,
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal({ starkKey }),
      })
      await repository.addManyIncluded([
        {
          transactionHash,
          blockNumber: 123,
          timestamp: Timestamp(123000),
          stateUpdateId: 123,
        },
      ])

      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal({ starkKey }),
      })

      // To be ignored (different stark key):
      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal({ starkKey: StarkKey.fake('abc') }),
      })

      expect(await repository.getCountByStarkKey(starkKey)).toEqual(2)
    })

    it('accepts an optional type parameter', async () => {
      const starkKey = StarkKey.fake('00fa')
      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal({ starkKey }),
      })
      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: fakeForcedTrade({ starkKeyA: starkKey }),
      })
      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: fakeForcedTrade({ starkKeyB: starkKey }),
      })

      expect(
        await repository.getCountByStarkKey(starkKey, ['ForcedTrade'])
      ).toEqual(2)
      expect(
        await repository.getCountByStarkKey(starkKey, [
          'ForcedTrade',
          'ForcedWithdrawal',
        ])
      ).toEqual(3)
    })
  })

  describe(UserTransactionRepository.prototype.countAll.name, () => {
    it('returns 0 for an empty database', async () => {
      expect(await repository.countAll()).toEqual(0)
    })

    it('returns the number of transactions', async () => {
      const transactionHash = Hash256.fake()
      await repository.add({
        transactionHash,
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal(),
      })
      await repository.addManyIncluded([
        {
          transactionHash,
          blockNumber: 123,
          timestamp: Timestamp(123000),
          stateUpdateId: 123,
        },
      ])

      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal(),
      })

      expect(await repository.countAll()).toEqual(2)
    })

    it('accepts an optional type parameter', async () => {
      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal(),
      })
      await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: fakeForcedTrade(),
      })

      expect(await repository.countAll(['ForcedTrade'])).toEqual(1)
      expect(
        await repository.countAll(['ForcedTrade', 'ForcedWithdrawal'])
      ).toEqual(2)
    })
  })

  describe(UserTransactionRepository.prototype.findById.name, () => {
    it('returns undefined for an unknown id', async () => {
      expect(await repository.findById(123)).toEqual(undefined)
    })

    it('returns a forced withdrawal', async () => {
      const transactionHash = Hash256.fake()
      const starkKey = StarkKey.fake()
      const id = await repository.add({
        transactionHash,
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: {
          type: 'ForcedWithdrawal',
          positionId: 1234n,
          starkKey,
          quantizedAmount: 123n,
        },
      })

      const record = await repository.findById(id)
      expect(record).toEqual({
        id,
        blockNumber: 123,
        starkKeyA: starkKey,
        starkKeyB: undefined,
        timestamp: Timestamp(123000),
        transactionHash,
        vaultOrPositionIdA: 1234n,
        vaultOrPositionIdB: undefined,
        included: undefined,
        data: {
          type: 'ForcedWithdrawal',
          positionId: 1234n,
          quantizedAmount: 123n,
          starkKey,
        },
      })
    })

    it('returns an included forced withdrawal', async () => {
      const transactionHash = Hash256.fake()
      const starkKey = StarkKey.fake()

      const id = await repository.add({
        transactionHash,
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: {
          type: 'ForcedWithdrawal',
          positionId: 1234n,
          starkKey,
          quantizedAmount: 123n,
        },
      })
      await repository.addManyIncluded([
        {
          blockNumber: 456,
          transactionHash,
          stateUpdateId: 69,
          timestamp: Timestamp(456000),
        },
      ])

      const record = await repository.findById(id)
      expect(record).toEqual({
        id,
        blockNumber: 123,
        starkKeyA: starkKey,
        starkKeyB: undefined,
        timestamp: Timestamp(123000),
        transactionHash,
        vaultOrPositionIdA: 1234n,
        vaultOrPositionIdB: undefined,
        included: {
          blockNumber: 456,
          stateUpdateId: 69,
          timestamp: Timestamp(456000),
        },
        data: {
          type: 'ForcedWithdrawal',
          positionId: 1234n,
          quantizedAmount: 123n,
          starkKey,
        },
      })
    })
  })

  describe(
    UserTransactionRepository.prototype.findByTransactionHash.name,
    () => {
      it('returns undefined for an unknown transaction hash', async () => {
        expect(await repository.findByTransactionHash(Hash256.fake())).toEqual(
          undefined
        )
      })

      it('returns a forced withdrawal', async () => {
        const transactionHash = Hash256.fake()
        const id = await repository.add({
          transactionHash,
          blockNumber: 123,
          timestamp: Timestamp(123000),
          data: fakeForcedWithdrawal(),
        })

        const record = await repository.findByTransactionHash(transactionHash)
        expect(record?.id).toEqual(id)
      })

      it('supports a type parameter', async () => {
        const transactionHash = Hash256.fake()
        const id = await repository.add({
          transactionHash,
          blockNumber: 123,
          timestamp: Timestamp(123000),
          data: fakeForcedWithdrawal(),
        })

        const first = await repository.findByTransactionHash(transactionHash, [
          'ForcedWithdrawal',
        ])
        expect(first?.id).toEqual(id)

        const second = await repository.findByTransactionHash(transactionHash, [
          'ForcedTrade',
          'Withdraw',
        ])
        expect(second).toEqual(undefined)
      })
    }
  )

  describe(
    UserTransactionRepository.prototype.findFirstWithdrawByStarkKeyAfter.name,
    () => {
      it('returns the first withdraw after the given timestamp', async () => {
        await repository.add({
          transactionHash: Hash256.fake('111'),
          blockNumber: 111,
          timestamp: Timestamp(111),
          data: fakeWithdraw({ starkKey: StarkKey.fake('aaa') }),
        })

        const first = await repository.findFirstWithdrawByStarkKeyAfter(
          StarkKey.fake('aaa'),
          Timestamp(0)
        )
        expect(first?.transactionHash).toEqual(Hash256.fake('111'))

        const second = await repository.findFirstWithdrawByStarkKeyAfter(
          StarkKey.fake('aaa'),
          Timestamp(222)
        )
        expect(second).toEqual(undefined)

        const third = await repository.findFirstWithdrawByStarkKeyAfter(
          StarkKey.fake('bbb'),
          Timestamp(0)
        )
        expect(third).toEqual(undefined)
      })
    }
  )

  describe(UserTransactionRepository.prototype.deleteAfter.name, () => {
    it('removes all transactions after the given block', async () => {
      const id1 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal(),
      })

      const id2 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal(),
      })

      expect(await repository.findById(id1)).not.toEqual(undefined)
      expect(await repository.findById(id2)).not.toEqual(undefined)

      await repository.deleteAfter(400)

      expect(await repository.findById(id1)).not.toEqual(undefined)
      expect(await repository.findById(id2)).toEqual(undefined)
    })

    it('can remove only included transactions', async () => {
      const transactionHash = Hash256.fake()
      const id = await repository.add({
        transactionHash,
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: fakeForcedWithdrawal(),
      })
      await repository.addManyIncluded([
        {
          transactionHash,
          blockNumber: 456,
          stateUpdateId: 1,
          timestamp: Timestamp(456000),
        },
      ])

      const before = await repository.findById(id)
      expect(before?.included).not.toEqual(undefined)

      await repository.deleteAfter(400)

      const after = await repository.findById(id)
      expect(after?.included).toEqual(undefined)
    })
  })

  describe(
    UserTransactionRepository.prototype.getByTransactionHashes.name,
    () => {
      it('returns an empty array if no records were found', async () => {
        expect(
          await repository.getByTransactionHashes([Hash256.fake()])
        ).toEqual([])
      })

      it('returns the records for the given transaction hashes', async () => {
        const transactionHash1 = Hash256.fake()
        const transactionHash2 = Hash256.fake()
        const transactionHash3 = Hash256.fake()

        const id1 = await repository.add({
          transactionHash: transactionHash1,
          blockNumber: 123,
          timestamp: Timestamp(123000),
          data: fakeForcedWithdrawal(),
        })

        await repository.add({
          transactionHash: transactionHash2,
          blockNumber: 456,
          timestamp: Timestamp(124000),
          data: fakeForcedWithdrawal(),
        })

        const id3 = await repository.add({
          transactionHash: transactionHash3,
          blockNumber: 789,
          timestamp: Timestamp(125000),
          data: fakeForcedWithdrawal(),
        })

        const records = await repository.getByTransactionHashes([
          transactionHash1,
          transactionHash3,
        ])
        expect(records.map((record) => record.id)).toEqualUnsorted([id3, id1])
        expect(records.map((record) => record.transactionHash)).toEqualUnsorted(
          [transactionHash3, transactionHash1]
        )
      })
    }
  )
})
