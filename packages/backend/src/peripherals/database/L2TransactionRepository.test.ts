import { StarkKey } from '@explorer/types'
import { expect } from 'earl'
import { it } from 'mocha'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { L2TransactionRepository } from './L2TransactionRepository'

describe(L2TransactionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()

  const repository = new L2TransactionRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  describe(`${L2TransactionRepository.prototype.add.name} and ${L2TransactionRepository.prototype.findById.name}`, () => {
    it('can add a transaction', async () => {
      const record = {
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      } as const
      const id = await repository.add(record)

      const transaction = await repository.findById(id)

      expect(transaction).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        type: record.data.type,
        data: record.data,
        altIndex: undefined,
        isReplaced: false,
      })
    })

    it('can add an alternative transaction', async () => {
      const record = {
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      } as const
      const alternativeRecord = {
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 12345n,
          amount: 5000n,
        },
      } as const
      const id = await repository.add(record)

      const transaction = await repository.findById(id)

      expect(transaction).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        type: record.data.type,
        data: record.data,
        altIndex: undefined,
        isReplaced: false,
      })

      const altId = await repository.add(alternativeRecord)

      const transactionAfterAlternative = await repository.findById(id)
      const altTransaction = await repository.findById(altId)

      expect(transactionAfterAlternative).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: record.data.starkKey,
        starkKeyB: undefined,
        type: record.data.type,
        data: record.data,
        altIndex: undefined,
        isReplaced: true,
      })

      expect(altTransaction).toEqual({
        stateUpdateId: alternativeRecord.stateUpdateId,
        transactionId: alternativeRecord.transactionId,
        blockNumber: alternativeRecord.blockNumber,
        starkKeyA: alternativeRecord.data.starkKey,
        starkKeyB: undefined,
        type: alternativeRecord.data.type,
        data: alternativeRecord.data,
        altIndex: 0,
        isReplaced: false,
      })
    })
  })

  describe(L2TransactionRepository.prototype.countByTransactionId.name, () => {
    it('returns 0 if there are no transactions', async () => {
      const count = await repository.countByTransactionId(1234)

      expect(count).toEqual(0)
    })

    it('returns the number of transactions', async () => {
      const record = {
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      } as const
      const record2 = {
        stateUpdateId: 2,
        transactionId: 1234,
        blockNumber: 123456,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      } as const
      await repository.add(record)
      await repository.add(record2)

      const count = await repository.countByTransactionId(record.transactionId)

      expect(count).toEqual(2)
    })
  })

  describe(
    L2TransactionRepository.prototype.findLatestStateUpdateId.name,
    () => {
      it('returns undefined if there are no transactions', async () => {
        const latestStateUpdateId = await repository.findLatestStateUpdateId()

        expect(latestStateUpdateId).toBeNullish()
      })

      it('returns the latest state update id', async () => {
        const latestStateUpdateRecord = {
          stateUpdateId: 10,
          transactionId: 12345,
          blockNumber: 123456,
          data: {
            type: 'Deposit',
            starkKey: StarkKey.fake(),
            positionId: 1234n,
            amount: 5000n,
          },
        } as const
        const record = {
          stateUpdateId: 1,
          transactionId: 1234,
          blockNumber: 12345,
          data: {
            type: 'Deposit',
            starkKey: StarkKey.fake(),
            positionId: 1234n,
            amount: 5000n,
          },
        } as const
        await repository.add(record)
        await repository.add(latestStateUpdateRecord)

        const latestStateUpdateId = await repository.findLatestStateUpdateId()

        expect(latestStateUpdateId).toEqual(
          latestStateUpdateRecord.stateUpdateId
        )
      })
    }
  )

  describe(L2TransactionRepository.prototype.deleteAfterBlock.name, () => {
    it('deletes transactions after a block', async () => {
      const record = {
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      } as const
      const recordToBeDeleted = {
        stateUpdateId: 2,
        transactionId: 12345,
        blockNumber: 123456,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      } as const
      const id = await repository.add(record)
      const deletedId = await repository.add(recordToBeDeleted)

      await repository.deleteAfterBlock(record.blockNumber)

      const transaction = await repository.findById(id)
      const deletedTransaction = await repository.findById(deletedId)

      expect(transaction).not.toBeNullish()
      expect(deletedTransaction).toBeNullish()
    })
  })
})
