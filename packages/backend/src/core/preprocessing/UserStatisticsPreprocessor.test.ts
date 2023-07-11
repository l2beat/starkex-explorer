import { Hash256, PedersenHash, StarkKey, Timestamp } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedStateUpdateRepository } from '../../peripherals/database/PreprocessedStateUpdateRepository'
import {
  PreprocessedUserStatisticsRecord,
  PreprocessedUserStatisticsRepository,
} from '../../peripherals/database/PreprocessedUserStatisticsRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { fakePreprocessedL2TransactionsStatistics } from '../../test/fakes'
import { Logger } from '../../tools/Logger'
import { sumNumericValuesByKey } from '../../utils/sumNumericValuesByKey'
import { UserStatisticsPreprocessor } from './UserStatisticsPreprocessor'

const stateUpdate: StateUpdateRecord = {
  id: 200,
  batchId: 199,
  blockNumber: 1_000,
  stateTransitionHash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  timestamp: Timestamp(1_000_000_000),
}

const buildPreprocessedAssetHistoryRecord = (
  id: number,
  starkKey?: StarkKey
) => ({
  id,
  stateUpdateId: 100 + id,
  blockNumber: 2_0000 + id,
  timestamp: Timestamp(9_000_000 + id),
  assetCount: 0,
  balanceChangeCount: 0,
  starkKey: starkKey ?? StarkKey.fake('ff' + id.toString()),
  prevHistoryId: undefined,
})

describe(UserStatisticsPreprocessor.name, () => {
  describe(
    UserStatisticsPreprocessor.prototype.preprocessNextStateUpdate.name,
    () => {
      it('should correctly calculate the new statistics record', async () => {
        const trx = mockObject<Knex.Transaction>()
        const sk1 = StarkKey.fake('ab1')
        const sk2 = StarkKey.fake('ab2')
        const sk3 = StarkKey.fake('ab3')
        const sk4 = StarkKey.fake('ab4')

        const mockPreprocessedUserStatisticsRepository =
          mockObject<PreprocessedUserStatisticsRepository>({
            add: mockFn().resolvesTo(undefined),
            findCurrentByStarkKey: async (starkKey) => {
              return {
                [sk1.toString()]: {
                  ...buildPreprocessedAssetHistoryRecord(1, sk1),
                },
                [sk2.toString()]: {
                  ...buildPreprocessedAssetHistoryRecord(1, sk2),
                  assetCount: 7,
                },
                [sk3.toString()]: {
                  ...buildPreprocessedAssetHistoryRecord(1, sk3),
                  assetCount: 9,
                  balanceChangeCount: 10,
                  prevHistoryId: 654,
                },
                [sk4.toString()]: undefined,
              }[starkKey.toString()]
            },
          })

        const mockPreprocessedAssetHistoryRepository =
          mockObject<PreprocessedAssetHistoryRepository>({
            getCountByStateUpdateIdGroupedByStarkKey: mockFn().resolvesTo([
              { starkKey: sk1, count: 5 },
              { starkKey: sk2, count: 10 },
              { starkKey: sk3, count: 15 },
              { starkKey: sk4, count: 20 },
            ]),
            getCountOfNewAssetsByStateUpdateIdGroupedByStarkKey:
              mockFn().resolvesTo([
                { starkKey: sk2, count: 100 },
                { starkKey: sk3, count: 150 },
                { starkKey: sk4, count: 200 },
              ]),
            getCountOfRemovedAssetsByStateUpdateIdGroupedByStarkKey:
              mockFn().resolvesTo([
                { starkKey: sk1, count: 200 },
                { starkKey: sk2, count: 100 },
                { starkKey: sk3, count: 350 },
              ]),
          })

        const userStatisticsPreprocessor = new UserStatisticsPreprocessor(
          mockPreprocessedUserStatisticsRepository,
          mockPreprocessedAssetHistoryRepository,
          mockObject<PreprocessedStateUpdateRepository>(),
          mockObject<StateUpdateRepository>(),
          mockObject<L2TransactionRepository>(),
          mockObject<KeyValueStore>(),
          Logger.SILENT
        )

        await userStatisticsPreprocessor.preprocessNextStateUpdate(
          trx,
          stateUpdate
        )

        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledTimes(4)
        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledWith(
          {
            stateUpdateId: 200,
            blockNumber: 1000,
            timestamp: Timestamp(1_000_000_000),
            starkKey: sk1,
            balanceChangeCount: 5,
            assetCount: -200,
            prevHistoryId: 1,
          },
          trx
        )
        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledWith(
          {
            stateUpdateId: 200,
            blockNumber: 1000,
            timestamp: Timestamp(1_000_000_000),
            starkKey: sk2,
            balanceChangeCount: 10,
            assetCount: 7,
            prevHistoryId: 1,
          },
          trx
        )
        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledWith(
          {
            stateUpdateId: 200,
            blockNumber: 1000,
            timestamp: Timestamp(1_000_000_000),
            starkKey: sk3,
            balanceChangeCount: 25,
            assetCount: -191,
            prevHistoryId: 1,
          },
          trx
        )
        expect(
          mockPreprocessedUserStatisticsRepository.add
        ).toHaveBeenCalledWith(
          {
            stateUpdateId: 200,
            blockNumber: 1000,
            timestamp: Timestamp(1_000_000_000),
            starkKey: sk4,
            balanceChangeCount: 20,
            assetCount: 200,
            prevHistoryId: undefined,
          },
          trx
        )
      })
    }
  )

  describe(
    UserStatisticsPreprocessor.prototype.rollbackOneStateUpdate.name,
    () => {
      it('should delete the state details', async () => {
        const trx = mockObject<Knex.Transaction>()
        const mockPreprocessedUserStatisticsRepository =
          mockObject<PreprocessedUserStatisticsRepository>({
            deleteByStateUpdateId: mockFn().resolvesTo(undefined),
          })

        const userStatisticsPreprocessor = new UserStatisticsPreprocessor(
          mockPreprocessedUserStatisticsRepository,
          mockObject<PreprocessedAssetHistoryRepository>(),
          mockObject<PreprocessedStateUpdateRepository>(),
          mockObject<StateUpdateRepository>(),
          mockObject<L2TransactionRepository>(),
          mockObject<KeyValueStore>(),
          Logger.SILENT
        )

        await userStatisticsPreprocessor.rollbackOneStateUpdate(
          trx,
          stateUpdate.id
        )

        expect(
          mockPreprocessedUserStatisticsRepository.deleteByStateUpdateId
        ).toHaveBeenOnlyCalledWith(stateUpdate.id, trx)
      })
    }
  )

  describe(
    UserStatisticsPreprocessor.prototype.catchUpL2Transactions.name,
    () => {
      const trx = mockObject<Knex.Transaction>()
      const recordsToUpdate: PreprocessedUserStatisticsRecord[] = [
        {
          id: 1,
          stateUpdateId: 200,
          starkKey: StarkKey.fake(),
        } as PreprocessedUserStatisticsRecord,
        {
          id: 2,
          stateUpdateId: 300,
          starkKey: StarkKey.fake(),
        } as PreprocessedUserStatisticsRecord,
        {
          id: 3,
          stateUpdateId: 400,
          starkKey: StarkKey.fake(),
        } as PreprocessedUserStatisticsRecord,
      ]

      const getStatisticsByStateUpdateIdAndStarkKeyResult =
        fakePreprocessedL2TransactionsStatistics()
      const findMostRecentWithL2TransactionsStatisticsByStarkKeyResult = {
        l2TransactionsStatistics: fakePreprocessedL2TransactionsStatistics(),
      }
      const preprocessTo = 120

      it('catches up using sum of latest preprocessed record statistics and current statistics as l2 transaction statistics', async () => {
        const mockPreprocessedUserStatisticsRepository =
          mockObject<PreprocessedUserStatisticsRepository>({
            getAllWithoutL2TransactionStatisticsUpToStateUpdateId:
              mockFn().resolvesTo(recordsToUpdate),
            findMostRecentWithL2TransactionsStatisticsByStarkKey:
              mockFn().resolvesTo(
                findMostRecentWithL2TransactionsStatisticsByStarkKeyResult
              ),
            update: mockFn().resolvesTo(1),
          })
        const mockL2TransactionRepository = mockObject<L2TransactionRepository>(
          {
            getStatisticsByStateUpdateIdAndStarkKey: mockFn().resolvesTo(
              getStatisticsByStateUpdateIdAndStarkKeyResult
            ),
          }
        )

        const userStatisticsPreprocessor = new UserStatisticsPreprocessor(
          mockPreprocessedUserStatisticsRepository,
          mockObject<PreprocessedAssetHistoryRepository>(),
          mockObject<PreprocessedStateUpdateRepository>(),
          mockObject<StateUpdateRepository>(),
          mockL2TransactionRepository,
          mockObject<KeyValueStore>(),
          Logger.SILENT
        )

        await userStatisticsPreprocessor.catchUpL2Transactions(
          trx,
          preprocessTo
        )

        expect(
          mockPreprocessedUserStatisticsRepository.getAllWithoutL2TransactionStatisticsUpToStateUpdateId
        ).toHaveBeenCalledWith(preprocessTo, trx)

        for (const recordToUpdate of recordsToUpdate) {
          expect(
            mockL2TransactionRepository.getStatisticsByStateUpdateIdAndStarkKey
          ).toHaveBeenCalledWith(
            recordToUpdate.stateUpdateId,
            recordToUpdate.starkKey,
            trx
          )

          expect(
            mockPreprocessedUserStatisticsRepository.findMostRecentWithL2TransactionsStatisticsByStarkKey
          ).toHaveBeenCalledWith(recordToUpdate.starkKey, trx)

          expect(
            mockPreprocessedUserStatisticsRepository.update
          ).toHaveBeenCalledWith(
            {
              id: recordToUpdate.id,
              l2TransactionsStatistics: sumNumericValuesByKey(
                findMostRecentWithL2TransactionsStatisticsByStarkKeyResult.l2TransactionsStatistics,
                getStatisticsByStateUpdateIdAndStarkKeyResult
              ),
            },
            trx
          )
        }
      })

      it('catches up using current statistics as l2 transaction statistics if no previous statistics', async () => {
        const mockPreprocessedUserStatisticsRepository =
          mockObject<PreprocessedUserStatisticsRepository>({
            getAllWithoutL2TransactionStatisticsUpToStateUpdateId:
              mockFn().resolvesTo(recordsToUpdate),
            findMostRecentWithL2TransactionsStatisticsByStarkKey:
              mockFn().resolvesTo(undefined),
            update: mockFn().resolvesTo(1),
          })
        const mockL2TransactionRepository = mockObject<L2TransactionRepository>(
          {
            getStatisticsByStateUpdateIdAndStarkKey: mockFn().resolvesTo(
              getStatisticsByStateUpdateIdAndStarkKeyResult
            ),
          }
        )

        const userStatisticsPreprocessor = new UserStatisticsPreprocessor(
          mockPreprocessedUserStatisticsRepository,
          mockObject<PreprocessedAssetHistoryRepository>(),
          mockObject<PreprocessedStateUpdateRepository>(),
          mockObject<StateUpdateRepository>(),
          mockL2TransactionRepository,
          mockObject<KeyValueStore>(),
          Logger.SILENT
        )

        await userStatisticsPreprocessor.catchUpL2Transactions(
          trx,
          preprocessTo
        )

        expect(
          mockPreprocessedUserStatisticsRepository.getAllWithoutL2TransactionStatisticsUpToStateUpdateId
        ).toHaveBeenCalledWith(preprocessTo, trx)

        for (const recordToUpdate of recordsToUpdate) {
          expect(
            mockL2TransactionRepository.getStatisticsByStateUpdateIdAndStarkKey
          ).toHaveBeenCalledWith(
            recordToUpdate.stateUpdateId,
            recordToUpdate.starkKey,
            trx
          )

          expect(
            mockPreprocessedUserStatisticsRepository.findMostRecentWithL2TransactionsStatisticsByStarkKey
          ).toHaveBeenCalledWith(recordToUpdate.starkKey, trx)

          expect(
            mockPreprocessedUserStatisticsRepository.update
          ).toHaveBeenCalledWith(
            {
              id: recordToUpdate.id,
              l2TransactionsStatistics:
                getStatisticsByStateUpdateIdAndStarkKeyResult,
            },
            trx
          )
        }
      })
    }
  )
})
