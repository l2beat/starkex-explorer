import { AssetId, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../../test/database'
import { Logger } from '../../../tools/Logger'
import { ForcedTradeData, ForcedWithdrawalData } from './UserTransaction'
import { UserTransactionRepository } from './UserTransactionRepository'

describe(UserTransactionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new UserTransactionRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  function fakeForcedWithdrawal(): ForcedWithdrawalData {
    return {
      type: 'ForcedWithdrawal',
      positionId: 1234n,
      starkKey: StarkKey.fake(),
      quantizedAmount: 123n,
    }
  }

  function fakeForcedTrade(): ForcedTradeData {
    return {
      type: 'ForcedTrade',
      positionIdA: 1234n,
      positionIdB: 1234n,
      starkKeyA: StarkKey.fake(),
      starkKeyB: StarkKey.fake(),
      collateralAmount: 123n,
      collateralAssetId: AssetId.USDC,
      syntheticAmount: 123n,
      syntheticAssetId: AssetId('ETH-9'),
      isABuyingSynthetic: true,
      nonce: 123n,
    }
  }

  it.skip(UserTransactionRepository.prototype.addManyIncluded.name)
  it.skip(UserTransactionRepository.prototype.getByStarkKey.name)
  it.skip(UserTransactionRepository.prototype.getByPositionId.name)
  it.skip(UserTransactionRepository.prototype.getByStateUpdateId.name)
  it.skip(
    UserTransactionRepository.prototype.getByStateUpdateIdAndPositionId.name
  )

  describe(UserTransactionRepository.prototype.getPaginated.name, () => {
    it('returns data', async () => {
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

      const data = await repository.getPaginated({ limit: 10, offset: 0 })
      expect(data).toEqual([
        {
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
        },
      ])
    })

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
      const data = await repository.getPaginated({ limit: 5, offset: 0 })
      expect(data.map((x) => x.id)).toEqual(ids.slice(0, 5))
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
      const data = await repository.getPaginated({ limit: 5, offset: 2 })
      expect(data.map((x) => x.id)).toEqual(ids.slice(2, 5 + 2))
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
      const data = await repository.getPaginated({
        limit: 5,
        offset: 0,
        types: ['ForcedWithdrawal'],
      })
      expect(data.map((x) => x.id)).toEqual(ids.slice(10, 15))
    })
  })

  it.skip(UserTransactionRepository.prototype.getNotIncluded.name)
  it.skip(UserTransactionRepository.prototype.countAll.name)
  it.skip(UserTransactionRepository.prototype.findById.name)
  it.skip(UserTransactionRepository.prototype.findByTransactionHash.name)

  describe(UserTransactionRepository.prototype.deleteAfter.name, () => {
    it('removes all transactions after the given block', async () => {
      const id1 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 123,
        timestamp: Timestamp(123000),
        data: {
          type: 'ForcedWithdrawal',
          positionId: 1234n,
          starkKey: StarkKey.fake(),
          quantizedAmount: 123n,
        },
      })

      const id2 = await repository.add({
        transactionHash: Hash256.fake(),
        blockNumber: 456,
        timestamp: Timestamp(123000),
        data: {
          type: 'ForcedWithdrawal',
          positionId: 1234n,
          starkKey: StarkKey.fake(),
          quantizedAmount: 123n,
        },
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
        data: {
          type: 'ForcedWithdrawal',
          positionId: 1234n,
          starkKey: StarkKey.fake(),
          quantizedAmount: 123n,
        },
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
})
