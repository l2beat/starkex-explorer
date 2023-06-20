import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earl'
import { it } from 'mocha'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { MultiL2TransactionData } from './L2Transaction'
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
        state: undefined,
        parentId: undefined,
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
        state: undefined,
        parentId: undefined,
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
        state: 'replaced',
        parentId: undefined,
      })

      expect(altTransaction).toEqual({
        stateUpdateId: alternativeRecord.stateUpdateId,
        transactionId: alternativeRecord.transactionId,
        blockNumber: alternativeRecord.blockNumber,
        starkKeyA: alternativeRecord.data.starkKey,
        starkKeyB: undefined,
        type: alternativeRecord.data.type,
        data: alternativeRecord.data,
        state: 'alternative',
        parentId: undefined,
      })
    })

    it('can add a multi transaction', async () => {
      const record = {
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'MultiTransaction',
          transactions: [
            {
              type: 'Deposit',
              starkKey: StarkKey.fake('1'),
              positionId: 1234n,
              amount: 5000n,
            },
            {
              positionId: 1234n,
              starkKey: StarkKey.fake('2'),
              ethereumAddress: EthereumAddress.fake(),
              amount: 12345n,
              nonce: 10n,
              expirationTimestamp: Timestamp(1234),
              signature: {
                r: Hash256.fake(),
                s: Hash256.fake(),
              },
              type: 'WithdrawalToAddress',
            },
          ],
        } as MultiL2TransactionData,
      }

      const id = await repository.add(record)

      const multiTransaction = await repository.findById(id)
      const firstTransactionOfMulti = await repository.findById(id + 1)
      const secondTransactionOfMulti = await repository.findById(id + 2)
      expect(multiTransaction).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        state: undefined,
        parentId: undefined,
        starkKeyA: undefined,
        starkKeyB: undefined,
        type: record.data.type,
        data: record.data,
      })
      expect(firstTransactionOfMulti).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        state: undefined,
        parentId: id,
        starkKeyA: StarkKey.fake('1'),
        starkKeyB: undefined,
        type: record.data.transactions[0]!.type,
        data: record.data.transactions[0]!,
      })
      expect(secondTransactionOfMulti).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        state: undefined,
        parentId: id,
        starkKeyA: StarkKey.fake('2'),
        starkKeyB: undefined,
        type: record.data.transactions[1]!.type,
        data: record.data.transactions[1]!,
      })
    })

    it('can add a multi transaction as an alternative transaction', async () => {
      const record = {
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'MultiTransaction',
          transactions: [
            {
              type: 'Deposit',
              starkKey: StarkKey.fake('1'),
              positionId: 1234n,
              amount: 5000n,
            },
            {
              positionId: 1234n,
              starkKey: StarkKey.fake('2'),
              ethereumAddress: EthereumAddress.fake(),
              amount: 12345n,
              nonce: 10n,
              expirationTimestamp: Timestamp(1234),
              signature: {
                r: Hash256.fake(),
                s: Hash256.fake(),
              },
              type: 'WithdrawalToAddress',
            },
          ],
        } as MultiL2TransactionData,
      }

      const alternativeRecord = {
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'MultiTransaction',
          transactions: [
            {
              type: 'Deposit',
              starkKey: StarkKey.fake('3'),
              positionId: 1234n,
              amount: 5000n,
            },
            {
              positionId: 1234n,
              starkKey: StarkKey.fake('4'),
              ethereumAddress: EthereumAddress.fake(),
              amount: 12345n,
              nonce: 10n,
              expirationTimestamp: Timestamp(1234),
              signature: {
                r: Hash256.fake(),
                s: Hash256.fake(),
              },
              type: 'WithdrawalToAddress',
            },
          ],
        } as MultiL2TransactionData,
      }

      const id = await repository.add(record)
      const altId = await repository.add(alternativeRecord)

      const multiAfterAlternative = await repository.findById(id)
      const firstTransactionOfMultiAfterAlternative = await repository.findById(
        id + 1
      )
      const secondTransactionOfMultiAfterAlternative =
        await repository.findById(id + 2)

      expect(multiAfterAlternative).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: undefined,
        starkKeyB: undefined,
        type: record.data.type,
        data: record.data,
        state: 'replaced',
        parentId: undefined,
      })
      expect(firstTransactionOfMultiAfterAlternative).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: StarkKey.fake('1'),
        starkKeyB: undefined,
        type: record.data.transactions[0]!.type,
        data: record.data.transactions[0]!,
        state: 'replaced',
        parentId: id,
      })
      expect(secondTransactionOfMultiAfterAlternative).toEqual({
        stateUpdateId: record.stateUpdateId,
        transactionId: record.transactionId,
        blockNumber: record.blockNumber,
        starkKeyA: StarkKey.fake('2'),
        starkKeyB: undefined,
        type: record.data.transactions[1]!.type,
        data: record.data.transactions[1]!,
        state: 'replaced',
        parentId: id,
      })

      const multiAltTransaction = await repository.findById(altId)
      const firstTransactionOfMultiAlt = await repository.findById(altId + 1)
      const secondTransactionOfMultiAlt = await repository.findById(altId + 2)

      expect(multiAltTransaction).toEqual({
        stateUpdateId: alternativeRecord.stateUpdateId,
        transactionId: alternativeRecord.transactionId,
        blockNumber: alternativeRecord.blockNumber,
        starkKeyA: undefined,
        starkKeyB: undefined,
        type: alternativeRecord.data.type,
        data: alternativeRecord.data,
        state: 'alternative',
        parentId: undefined,
      })

      expect(firstTransactionOfMultiAlt).toEqual({
        stateUpdateId: alternativeRecord.stateUpdateId,
        transactionId: alternativeRecord.transactionId,
        blockNumber: alternativeRecord.blockNumber,
        starkKeyA: StarkKey.fake('3'),
        starkKeyB: undefined,
        type: alternativeRecord.data.transactions[0]!.type,
        data: alternativeRecord.data.transactions[0]!,
        state: 'alternative',
        parentId: altId,
      })
      expect(secondTransactionOfMultiAlt).toEqual({
        stateUpdateId: alternativeRecord.stateUpdateId,
        transactionId: alternativeRecord.transactionId,
        blockNumber: alternativeRecord.blockNumber,
        starkKeyA: StarkKey.fake('4'),
        starkKeyB: undefined,
        type: alternativeRecord.data.transactions[1]!.type,
        data: alternativeRecord.data.transactions[1]!,
        state: 'alternative',
        parentId: altId,
      })
    })
  })

  describe(L2TransactionRepository.prototype.countByTransactionId.name, () => {
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

    it('considers multi transactions as a single transaction', async () => {
      await repository.add({
        stateUpdateId: 1,
        transactionId: 1234,
        blockNumber: 12345,
        data: {
          type: 'MultiTransaction',
          transactions: [
            {
              type: 'Deposit',
              starkKey: StarkKey.fake('1'),
              positionId: 1234n,
              amount: 5000n,
            },
            {
              positionId: 1234n,
              starkKey: StarkKey.fake('2'),
              ethereumAddress: EthereumAddress.fake(),
              amount: 12345n,
              nonce: 10n,
              expirationTimestamp: Timestamp(1234),
              signature: {
                r: Hash256.fake(),
                s: Hash256.fake(),
              },
              type: 'WithdrawalToAddress',
            },
          ],
        } as MultiL2TransactionData,
      })
      await repository.add({
        stateUpdateId: 2,
        transactionId: 1234,
        blockNumber: 123456,
        data: {
          type: 'Deposit',
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          amount: 5000n,
        },
      })

      const count = await repository.countByTransactionId(1234)
      expect(count).toEqual(2)
    })

    it('returns 0 if there are no transactions', async () => {
      const count = await repository.countByTransactionId(1234)

      expect(count).toEqual(0)
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
