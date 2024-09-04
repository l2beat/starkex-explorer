import { AssetHash, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { expect } from 'earl'

import { setupDatabaseTestSuite } from '../../../test/database'
import { ForcedWithdrawalData, WithdrawData } from './SentTransaction'
import { SentTransactionRepository } from './SentTransactionRepository'

describe(SentTransactionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new SentTransactionRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  function fakeForcedWithdrawal(
    override?: Partial<ForcedWithdrawalData>
  ): ForcedWithdrawalData {
    return {
      type: 'ForcedWithdrawal',
      starkKey: StarkKey.fake(),
      positionId: 1n,
      quantizedAmount: 2n,
      premiumCost: false,
      ...override,
    }
  }

  function fakeWithdraw(override?: Partial<WithdrawData>): WithdrawData {
    return {
      type: 'Withdraw',
      starkKey: StarkKey.fake(),
      assetType: AssetHash.fake('1234'),
      ...override,
    }
  }

  describe(SentTransactionRepository.prototype.getNotMinedHashes.name, () => {
    it('returns hashes of not mined transactions', async () => {
      const hash1 = await repository.add({
        transactionHash: Hash256.fake('111'),
        timestamp: Timestamp(100),
        data: fakeForcedWithdrawal(),
      })

      const hash2 = await repository.add({
        transactionHash: Hash256.fake('222'),
        timestamp: Timestamp(200),
        data: fakeForcedWithdrawal(),
      })

      const hash3 = await repository.add({
        transactionHash: Hash256.fake('333'),
        timestamp: Timestamp(300),
        data: fakeForcedWithdrawal(),
      })
      await repository.updateMined(hash3, {
        timestamp: Timestamp(3001),
        blockNumber: 1,
        reverted: false,
      })

      expect(await repository.getNotMinedHashes()).toEqual([hash2, hash1])
    })
  })

  describe(SentTransactionRepository.prototype.getByStarkKey.name, () => {
    it('returns transactions by stark key', async () => {
      const starkKey = StarkKey.fake('aaa')

      const withdrawal1 = fakeForcedWithdrawal({ starkKey })
      const hash1 = await repository.add({
        transactionHash: Hash256.fake('111'),
        timestamp: Timestamp(100),
        data: withdrawal1,
      })

      const withdrawal2 = fakeForcedWithdrawal({ starkKey })
      const hash2 = await repository.add({
        transactionHash: Hash256.fake('222'),
        timestamp: Timestamp(200),
        data: withdrawal2,
      })
      await repository.updateMined(hash2, {
        timestamp: Timestamp(2001),
        blockNumber: 1,
        reverted: false,
      })

      await repository.add({
        transactionHash: Hash256.fake('333'),
        timestamp: Timestamp(300),
        data: fakeForcedWithdrawal(),
      })

      expect(await repository.getByStarkKey(starkKey)).toEqual([
        {
          sentTimestamp: Timestamp(200),
          transactionHash: hash2,
          starkKey: withdrawal2.starkKey,
          vaultOrPositionId: withdrawal2.positionId,
          data: withdrawal2,
          mined: {
            timestamp: Timestamp(2001),
            blockNumber: 1,
            reverted: false,
          },
        },
        {
          sentTimestamp: Timestamp(100),
          transactionHash: hash1,
          starkKey: withdrawal1.starkKey,
          vaultOrPositionId: withdrawal1.positionId,
          data: withdrawal1,
          mined: undefined,
        },
      ])
    })

    it('returns transactions by stark key when type is provided', async () => {
      const starkKey = StarkKey.fake('aaa')

      const withdrawal = fakeWithdraw({ starkKey })
      await repository.add({
        transactionHash: Hash256.fake('111'),
        timestamp: Timestamp(100),
        data: withdrawal,
      })

      const forcedWithdrawal = fakeForcedWithdrawal({ starkKey })
      const hash2 = await repository.add({
        transactionHash: Hash256.fake('222'),
        timestamp: Timestamp(200),
        data: forcedWithdrawal,
      })
      await repository.updateMined(hash2, {
        timestamp: Timestamp(2001),
        blockNumber: 1,
        reverted: false,
      })

      await repository.add({
        transactionHash: Hash256.fake('333'),
        timestamp: Timestamp(300),
        data: fakeForcedWithdrawal(),
      })

      expect(
        await repository.getByStarkKey(starkKey, ['ForcedWithdrawal'])
      ).toEqual([
        {
          sentTimestamp: Timestamp(200),
          transactionHash: hash2,
          starkKey: forcedWithdrawal.starkKey,
          vaultOrPositionId: forcedWithdrawal.positionId,
          data: forcedWithdrawal,
          mined: {
            timestamp: Timestamp(2001),
            blockNumber: 1,
            reverted: false,
          },
        },
      ])
    })
  })

  describe(SentTransactionRepository.prototype.getByPositionId.name, () => {
    it('returns transactions by position id', async () => {
      const positionId = 1234n

      const withdrawal1 = fakeForcedWithdrawal({ positionId })
      const hash1 = await repository.add({
        transactionHash: Hash256.fake('111'),
        timestamp: Timestamp(100),
        data: withdrawal1,
      })

      const withdrawal2 = fakeForcedWithdrawal({ positionId })
      const hash2 = await repository.add({
        transactionHash: Hash256.fake('222'),
        timestamp: Timestamp(200),
        data: withdrawal2,
      })
      await repository.updateMined(hash2, {
        timestamp: Timestamp(2001),
        blockNumber: 1,
        reverted: false,
      })

      await repository.add({
        transactionHash: Hash256.fake('333'),
        timestamp: Timestamp(300),
        data: fakeForcedWithdrawal(),
      })

      expect(await repository.getByPositionId(positionId)).toEqual([
        {
          sentTimestamp: Timestamp(200),
          transactionHash: hash2,
          starkKey: withdrawal2.starkKey,
          vaultOrPositionId: withdrawal2.positionId,
          data: withdrawal2,
          mined: {
            timestamp: Timestamp(2001),
            blockNumber: 1,
            reverted: false,
          },
        },
        {
          sentTimestamp: Timestamp(100),
          transactionHash: hash1,
          starkKey: withdrawal1.starkKey,
          vaultOrPositionId: withdrawal1.positionId,
          data: withdrawal1,
          mined: undefined,
        },
      ])
    })
  })

  describe(
    SentTransactionRepository.prototype.countNotMinedByPositionId.name,
    () => {
      it('returns the number of not mined transactions', async () => {
        const positionId = 1234n

        const withdrawal1 = fakeForcedWithdrawal({ positionId })
        await repository.add({
          transactionHash: Hash256.fake('111'),
          timestamp: Timestamp(100),
          data: withdrawal1,
        })

        const withdrawal2 = fakeForcedWithdrawal({ positionId })
        const hash2 = await repository.add({
          transactionHash: Hash256.fake('222'),
          timestamp: Timestamp(200),
          data: withdrawal2,
        })
        await repository.updateMined(hash2, {
          timestamp: Timestamp(2001),
          blockNumber: 1,
          reverted: false,
        })

        const withdrawal3 = fakeForcedWithdrawal({ positionId })
        await repository.add({
          transactionHash: Hash256.fake('333'),
          timestamp: Timestamp(300),
          data: withdrawal3,
        })

        await repository.add({
          transactionHash: Hash256.fake('444'),
          timestamp: Timestamp(400),
          data: fakeForcedWithdrawal(),
        })

        expect(await repository.countNotMinedByPositionId(positionId)).toEqual(
          2
        )
      })
    }
  )

  describe(
    SentTransactionRepository.prototype.findByTransactionHash.name,
    () => {
      it('returns undefined for a non-existent transaction', async () => {
        expect(await repository.findByTransactionHash(Hash256.fake())).toEqual(
          undefined
        )
      })

      it('returns a not mined transaction', async () => {
        const data = fakeForcedWithdrawal()
        const hash = await repository.add({
          transactionHash: Hash256.fake(),
          timestamp: Timestamp(100),
          data,
        })

        expect(await repository.findByTransactionHash(hash)).toEqual({
          sentTimestamp: Timestamp(100),
          transactionHash: hash,
          starkKey: data.starkKey,
          vaultOrPositionId: data.positionId,
          data,
          mined: undefined,
        })
      })

      it('returns a mined transaction', async () => {
        const data = fakeForcedWithdrawal()
        const hash = await repository.add({
          transactionHash: Hash256.fake(),
          timestamp: Timestamp(100),
          data,
        })
        await repository.updateMined(hash, {
          timestamp: Timestamp(200),
          blockNumber: 1,
          reverted: false,
        })

        expect(await repository.findByTransactionHash(hash)).toEqual({
          sentTimestamp: Timestamp(100),
          transactionHash: hash,
          starkKey: data.starkKey,
          vaultOrPositionId: data.positionId,
          data,
          mined: {
            timestamp: Timestamp(200),
            blockNumber: 1,
            reverted: false,
          },
        })
      })

      it('returns a reverted transaction', async () => {
        const data = fakeForcedWithdrawal()
        const hash = await repository.add({
          transactionHash: Hash256.fake(),
          timestamp: Timestamp(100),
          data,
        })
        await repository.updateMined(hash, {
          timestamp: Timestamp(200),
          blockNumber: 1,
          reverted: true,
        })

        expect(await repository.findByTransactionHash(hash)).toEqual({
          sentTimestamp: Timestamp(100),
          transactionHash: hash,
          starkKey: data.starkKey,
          vaultOrPositionId: data.positionId,
          data,
          mined: {
            timestamp: Timestamp(200),
            blockNumber: 1,
            reverted: true,
          },
        })
      })
    }
  )

  describe(
    SentTransactionRepository.prototype.findFirstWithdrawByStarkKeyAfter.name,
    () => {
      const starkKey = StarkKey.fake()
      const data = fakeWithdraw({ starkKey })

      beforeEach(async () => {
        await repository.add({
          transactionHash: Hash256.fake('111'),
          timestamp: Timestamp(100),
          data,
        })
        await repository.updateMined(Hash256.fake('111'), {
          blockNumber: 1,
          timestamp: Timestamp(101),
          reverted: true,
        })

        await repository.add({
          transactionHash: Hash256.fake('222'),
          timestamp: Timestamp(200),
          data,
        })
        await repository.updateMined(Hash256.fake('222'), {
          blockNumber: 2,
          timestamp: Timestamp(202),
          reverted: false,
        })

        await repository.add({
          transactionHash: Hash256.fake('333'),
          timestamp: Timestamp(300),
          data,
        })
      })

      it('returns undefined for an unknown stark key', async () => {
        expect(
          await repository.findFirstWithdrawByStarkKeyAfter(
            StarkKey.fake(),
            Timestamp(0)
          )
        ).toEqual(undefined)
      })

      it('returns undefined for a late timestamp', async () => {
        expect(
          await repository.findFirstWithdrawByStarkKeyAfter(
            starkKey,
            Timestamp(1000000)
          )
        ).toEqual(undefined)
      })

      it('returns first not reverted transaction', async () => {
        expect(
          await repository.findFirstWithdrawByStarkKeyAfter(
            starkKey,
            Timestamp(0)
          )
        ).toEqual({
          sentTimestamp: Timestamp(200),
          transactionHash: Hash256.fake('222'),
          starkKey,
          vaultOrPositionId: undefined,
          data,
          mined: {
            timestamp: Timestamp(202),
            blockNumber: 2,
            reverted: false,
          },
        })
      })

      it('handles a later timestamp', async () => {
        expect(
          await repository.findFirstWithdrawByStarkKeyAfter(
            starkKey,
            Timestamp(250)
          )
        ).toEqual({
          sentTimestamp: Timestamp(300),
          transactionHash: Hash256.fake('333'),
          starkKey,
          vaultOrPositionId: undefined,
          data,
          mined: undefined,
        })
      })
    }
  )

  describe(
    SentTransactionRepository.prototype.deleteByTransactionHash.name,
    () => {
      it('removes a transaction', async () => {
        const hash = await repository.add({
          transactionHash: Hash256.fake(),
          timestamp: Timestamp(100),
          data: fakeForcedWithdrawal(),
        })

        expect(await repository.findByTransactionHash(hash)).not.toEqual(
          undefined
        )

        await repository.deleteByTransactionHash(hash)

        expect(await repository.findByTransactionHash(hash)).toEqual(undefined)
      })
    }
  )

  describe(
    SentTransactionRepository.prototype.getByTransactionHashes.name,
    () => {
      it('returns an empty array if no records were found', async () => {
        expect(
          await repository.getByTransactionHashes([
            Hash256.fake(),
            Hash256.fake(),
          ])
        ).toEqual([])
      })

      it('returns an array of transactions', async () => {
        const hash1 = await repository.add({
          transactionHash: Hash256.fake(),
          timestamp: Timestamp(100),
          data: fakeForcedWithdrawal(),
        })
        await repository.add({
          transactionHash: Hash256.fake(),
          timestamp: Timestamp(200),
          data: fakeForcedWithdrawal(),
        })
        const hash3 = await repository.add({
          transactionHash: Hash256.fake(),
          timestamp: Timestamp(300),
          data: fakeForcedWithdrawal(),
        })

        const results = await repository.getByTransactionHashes([hash1, hash3])

        expect(results.map((result) => result.transactionHash)).toEqual([
          hash1,
          hash3,
        ])
      })
    }
  )
})
