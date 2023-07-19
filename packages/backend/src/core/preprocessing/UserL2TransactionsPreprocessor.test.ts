import { StarkKey } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedUserL2TransactionsRepository } from '../../peripherals/database/PreprocessedUserL2TransactionsRepository'
import { fakePreprocessedL2TransactionsStatistics } from '../../test/fakes'
import { Logger } from '../../tools/Logger'
import { sumNumericValuesByKey } from '../../utils/sumNumericValuesByKey'
import { UserL2TransactionsPreprocessor } from './UserL2TransactionsPreprocessor'

describe.only(UserL2TransactionsPreprocessor.name, () => {
  describe(UserL2TransactionsPreprocessor.prototype.catchUp.name, () => {
    it('should catch up user L2 transactions from last preprocessed state update id', async () => {
      const start = 98
      const preprocessTo = 100
      const starkKeys = [
        StarkKey.fake('a'),
        StarkKey.fake('b'),
        StarkKey.fake('c'),
      ] as const
      const fakeStatistics = fakePreprocessedL2TransactionsStatistics()
      const starkKeyToStateUpdateHelper = [
        [starkKeys[0], start + 1],
        [starkKeys[1], start + 1],
        [starkKeys[2], start + 2],
      ] as const

      const mockKnexTransaction = mockObject<Knex.Transaction>()
      const mockPreprocessedUserL2TransactionsRepository =
        mockObject<PreprocessedUserL2TransactionsRepository>({
          findLast: mockFn().resolvesTo({
            stateUpdateId: start,
          }),
          findCurrentByStarkKey: mockFn().resolvesTo({
            cumulativeL2TransactionsStatistics: fakeStatistics,
          }),
          add: mockFn().resolvesTo(1),
        })
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        getStarkKeysByStateUpdateId: mockFn()
          .resolvesToOnce([starkKeys[0], starkKeys[1]])
          .resolvesToOnce([starkKeys[2]]),
        getStatisticsByStateUpdateIdAndStarkKey:
          mockFn().resolvesTo(fakeStatistics),
      })

      const userL2TransactionsPreprocessor = new UserL2TransactionsPreprocessor(
        mockPreprocessedUserL2TransactionsRepository,
        mockL2TransactionRepository,
        Logger.SILENT
      )

      await userL2TransactionsPreprocessor.catchUp(
        mockKnexTransaction,
        preprocessTo
      )

      expect(
        mockPreprocessedUserL2TransactionsRepository.findLast
      ).toHaveBeenCalledTimes(1)
      expect(
        mockL2TransactionRepository.getStarkKeysByStateUpdateId
      ).toHaveBeenNthCalledWith(1, start + 1, mockKnexTransaction)
      expect(
        mockL2TransactionRepository.getStarkKeysByStateUpdateId
      ).toHaveBeenNthCalledWith(2, start + 2, mockKnexTransaction)

      starkKeyToStateUpdateHelper.forEach(
        ([starkKey, stateUpdateId], index) => {
          expect(
            mockL2TransactionRepository.getStatisticsByStateUpdateIdAndStarkKey
          ).toHaveBeenNthCalledWith(
            index + 1,
            stateUpdateId,
            starkKey,
            mockKnexTransaction
          )
          expect(
            mockPreprocessedUserL2TransactionsRepository.findCurrentByStarkKey
          ).toHaveBeenNthCalledWith(index + 1, starkKey, mockKnexTransaction)
          expect(
            mockPreprocessedUserL2TransactionsRepository.add
          ).toHaveBeenNthCalledWith(
            index + 1,
            {
              stateUpdateId,
              starkKey,
              l2TransactionsStatistics: fakeStatistics,
              cumulativeL2TransactionsStatistics: sumNumericValuesByKey(
                fakeStatistics,
                fakeStatistics
              ),
            },
            mockKnexTransaction
          )
        }
      )
    })
    it('should catch up user L2 transactions from 1 if nothing was preprocessed before ', async () => {
      const preprocessTo = 2
      const starkKeys = [
        StarkKey.fake('a'),
        StarkKey.fake('b'),
        StarkKey.fake('c'),
      ] as const
      const fakeStatistics = fakePreprocessedL2TransactionsStatistics()
      const starkKeyToStateUpdateHelper = [
        [starkKeys[0], 1],
        [starkKeys[1], 1],
        [starkKeys[2], 2],
      ] as const

      const mockKnexTransaction = mockObject<Knex.Transaction>()
      const mockPreprocessedUserL2TransactionsRepository =
        mockObject<PreprocessedUserL2TransactionsRepository>({
          findLast: mockFn().resolvesTo(undefined),
          findCurrentByStarkKey: mockFn().resolvesTo({
            cumulativeL2TransactionsStatistics: fakeStatistics,
          }),
          add: mockFn().resolvesTo(1),
        })
      const mockL2TransactionRepository = mockObject<L2TransactionRepository>({
        getStarkKeysByStateUpdateId: mockFn()
          .resolvesToOnce([starkKeys[0], starkKeys[1]])
          .resolvesToOnce([starkKeys[2]]),
        getStatisticsByStateUpdateIdAndStarkKey:
          mockFn().resolvesTo(fakeStatistics),
      })

      const userL2TransactionsPreprocessor = new UserL2TransactionsPreprocessor(
        mockPreprocessedUserL2TransactionsRepository,
        mockL2TransactionRepository,
        Logger.SILENT
      )

      await userL2TransactionsPreprocessor.catchUp(
        mockKnexTransaction,
        preprocessTo
      )

      expect(
        mockPreprocessedUserL2TransactionsRepository.findLast
      ).toHaveBeenCalledTimes(1)
      expect(
        mockL2TransactionRepository.getStarkKeysByStateUpdateId
      ).toHaveBeenNthCalledWith(1, 1, mockKnexTransaction)
      expect(
        mockL2TransactionRepository.getStarkKeysByStateUpdateId
      ).toHaveBeenNthCalledWith(2, 2, mockKnexTransaction)

      starkKeyToStateUpdateHelper.forEach(
        ([starkKey, stateUpdateId], index) => {
          expect(
            mockL2TransactionRepository.getStatisticsByStateUpdateIdAndStarkKey
          ).toHaveBeenNthCalledWith(
            index + 1,
            stateUpdateId,
            starkKey,
            mockKnexTransaction
          )
          expect(
            mockPreprocessedUserL2TransactionsRepository.findCurrentByStarkKey
          ).toHaveBeenNthCalledWith(index + 1, starkKey, mockKnexTransaction)
          expect(
            mockPreprocessedUserL2TransactionsRepository.add
          ).toHaveBeenNthCalledWith(
            index + 1,
            {
              stateUpdateId,
              starkKey,
              l2TransactionsStatistics: fakeStatistics,
              cumulativeL2TransactionsStatistics: sumNumericValuesByKey(
                fakeStatistics,
                fakeStatistics
              ),
            },
            mockKnexTransaction
          )
        }
      )
    })
  })
  describe(
    UserL2TransactionsPreprocessor.prototype.rollbackOneStateUpdate.name,
    () => {
      it('should rollback one state update', async () => {
        const stateUpdateId = 123
        const mockKnexTransaction = mockObject<Knex.Transaction>({})

        const mockPreprocessedUserL2TransactionsRepository =
          mockObject<PreprocessedUserL2TransactionsRepository>({
            deleteByStateUpdateId: mockFn().resolvesTo(1),
          })
        const preprocessor = new UserL2TransactionsPreprocessor(
          mockPreprocessedUserL2TransactionsRepository,
          mockObject<L2TransactionRepository>(),
          Logger.SILENT
        )

        await preprocessor.rollbackOneStateUpdate(
          mockKnexTransaction,
          stateUpdateId
        )

        expect(
          mockPreprocessedUserL2TransactionsRepository.deleteByStateUpdateId
        ).toHaveBeenCalledWith(stateUpdateId, mockKnexTransaction)
      })
    }
  )
})
