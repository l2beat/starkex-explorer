import { AssetHash, Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'
import range from 'lodash/range'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { sumPreprocessedL2TransactionsStatistics } from '../../peripherals/database/PreprocessedL2TransactionsStatistics'
import {
  PreprocessedStateDetailsRecord,
  PreprocessedStateDetailsRepository,
} from '../../peripherals/database/PreprocessedStateDetailsRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { fakePreprocessedL2TransactionsStatistics } from '../../test/fakes'
import { StateDetailsPreprocessor } from './StateDetailsPreprocessor'

const stateUpdate: StateUpdateRecord = {
  id: 200,
  batchId: 199,
  blockNumber: 1_000,
  stateTransitionHash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  timestamp: Timestamp(1_000_000_000),
}

describe(StateDetailsPreprocessor.name, () => {
  describe(
    StateDetailsPreprocessor.prototype.preprocessNextStateUpdate.name,
    () => {
      it('should calculate assetUpdateCount and forcedTransactionCount', async () => {
        const trx = mockObject<Knex.Transaction>()
        const preprocessedStateDetailsId = 15

        const mockPreprocessedAssetHistoryRepository = mockObject<
          PreprocessedAssetHistoryRepository<AssetHash>
        >({
          getCountByStateUpdateId: mockFn().resolvesTo(10),
        })
        const mockUserTransactionRepository =
          mockObject<UserTransactionRepository>({
            getCountOfIncludedByStateUpdateId: mockFn().resolvesTo(20),
          })
        const mockPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            add: mockFn().resolvesTo(preprocessedStateDetailsId),
          })
        const mockL2TransactionRepository = mockObject<L2TransactionRepository>(
          {}
        )

        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockPreprocessedStateDetailsRepository,
          mockPreprocessedAssetHistoryRepository,
          mockUserTransactionRepository,
          mockL2TransactionRepository
        )

        await stateDetailsPreprocessor.preprocessNextStateUpdate(
          trx,
          stateUpdate
        )

        expect(
          mockPreprocessedStateDetailsRepository.add
        ).toHaveBeenOnlyCalledWith(
          {
            stateUpdateId: stateUpdate.id,
            stateTransitionHash: stateUpdate.stateTransitionHash,
            rootHash: stateUpdate.rootHash,
            blockNumber: stateUpdate.blockNumber,
            timestamp: stateUpdate.timestamp,
            assetUpdateCount: 10,
            forcedTransactionCount: 20,
          },
          trx
        )
      })
    }
  )

  describe(
    StateDetailsPreprocessor.prototype.rollbackOneStateUpdate.name,
    () => {
      it('should delete the state details', async () => {
        const trx = mockObject<Knex.Transaction>()
        const mockPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            deleteByStateUpdateId: mockFn().resolvesTo(undefined),
          })

        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockPreprocessedStateDetailsRepository,
          mockObject<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mockObject<UserTransactionRepository>(),
          mockObject<L2TransactionRepository>()
        )

        await stateDetailsPreprocessor.rollbackOneStateUpdate(
          trx,
          stateUpdate.id
        )

        expect(
          mockPreprocessedStateDetailsRepository.deleteByStateUpdateId
        ).toHaveBeenOnlyCalledWith(stateUpdate.id, trx)
      })
    }
  )

  describe(
    StateDetailsPreprocessor.prototype.catchUpL2Transactions.name,
    () => {
      it('should catch up preprocessed records with l2 transaction data from lastPreprocessedRecordWithL2TransactionCount to the currently preprocessed state update', async () => {
        const trx = mockObject<Knex.Transaction>()
        const catchUpToStateUpdateId = 200
        const lastPreprocessedRecordWithL2TransactionCount = {
          stateUpdateId: 195,
        }
        const lastL2TransactionStateUpdateId = 210
        const mockedPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            findLastWithL2TransactionsStatistics: mockFn().resolvesTo(
              lastPreprocessedRecordWithL2TransactionCount
            ),
            findByStateUpdateId: mockFn(async (id: number) =>
              fakePreprocessedStateDetailsRecord(id)
            ),
            update: mockFn().resolvesTo(1),
          })
        const mockedL2TransactionRepository =
          mockObject<L2TransactionRepository>({
            findLatestStateUpdateId: mockFn().resolvesTo(
              lastL2TransactionStateUpdateId
            ),
            getStatisticsByStateUpdateId: mockFn(
              async (stateUpdateId: number) =>
                fakePreprocessedL2TransactionsStatistics(stateUpdateId)
            ),
          })
        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockedPreprocessedStateDetailsRepository,
          mockObject<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mockObject<UserTransactionRepository>(),
          mockedL2TransactionRepository
        )

        await stateDetailsPreprocessor.catchUpL2Transactions(
          trx,
          catchUpToStateUpdateId
        )

        expect(
          mockedPreprocessedStateDetailsRepository.findLastWithL2TransactionsStatistics
        ).toHaveBeenCalledWith(trx)
        expect(
          mockedL2TransactionRepository.findLatestStateUpdateId
        ).toHaveBeenCalledWith(trx)

        range(
          catchUpToStateUpdateId -
            lastPreprocessedRecordWithL2TransactionCount.stateUpdateId
        ).forEach((i) => {
          expect(
            mockedPreprocessedStateDetailsRepository.findByStateUpdateId
          ).toHaveBeenNthCalledWith(
            2 * i + 1,
            lastPreprocessedRecordWithL2TransactionCount.stateUpdateId + i + 1,
            trx
          )

          expect(
            mockedL2TransactionRepository.getStatisticsByStateUpdateId
          ).toHaveBeenNthCalledWith(
            i + 1,
            lastPreprocessedRecordWithL2TransactionCount.stateUpdateId + i + 1,
            trx
          )

          expect(
            mockedPreprocessedStateDetailsRepository.findByStateUpdateId
          ).toHaveBeenNthCalledWith(
            2 * i + 2,
            lastPreprocessedRecordWithL2TransactionCount.stateUpdateId + i,
            trx
          )

          expect(
            mockedPreprocessedStateDetailsRepository.update
          ).toHaveBeenNthCalledWith(
            i + 1,
            {
              id:
                lastPreprocessedRecordWithL2TransactionCount.stateUpdateId +
                i +
                2,
              l2TransactionsStatistics:
                fakePreprocessedL2TransactionsStatistics(
                  lastPreprocessedRecordWithL2TransactionCount.stateUpdateId +
                    i +
                    1
                ),
              cumulativeL2TransactionsStatistics:
                sumPreprocessedL2TransactionsStatistics(
                  fakePreprocessedL2TransactionsStatistics(
                    lastPreprocessedRecordWithL2TransactionCount.stateUpdateId +
                      i
                  ),
                  fakePreprocessedL2TransactionsStatistics(
                    lastPreprocessedRecordWithL2TransactionCount.stateUpdateId +
                      i +
                      1
                  )
                ),
            },
            trx
          )
        })
      })

      it('should catch up preprocessed records with l2 transaction data from 0 (if no record was preprocessed before) to the latest l2 transaction state update id', async () => {
        const trx = mockObject<Knex.Transaction>()
        const catchUpToStateUpdateId = 10
        const lastL2TransactionStateUpdateId = 5
        const mockedPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            findLastWithL2TransactionsStatistics:
              mockFn().resolvesTo(undefined),
            findByStateUpdateId: mockFn(async (stateUpdateId: number) =>
              fakePreprocessedStateDetailsRecord(stateUpdateId)
            ),
            update: mockFn().resolvesTo(1),
          })
        const mockedL2TransactionRepository =
          mockObject<L2TransactionRepository>({
            findLatestStateUpdateId: mockFn().resolvesTo(
              lastL2TransactionStateUpdateId
            ),
            getStatisticsByStateUpdateId: mockFn(
              async (stateUpdateId: number) =>
                fakePreprocessedL2TransactionsStatistics(stateUpdateId)
            ),
          })
        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockedPreprocessedStateDetailsRepository,
          mockObject<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mockObject<UserTransactionRepository>(),
          mockedL2TransactionRepository
        )

        await stateDetailsPreprocessor.catchUpL2Transactions(
          trx,
          catchUpToStateUpdateId
        )

        expect(
          mockedPreprocessedStateDetailsRepository.findLastWithL2TransactionsStatistics
        ).toHaveBeenCalledWith(trx)
        expect(
          mockedL2TransactionRepository.findLatestStateUpdateId
        ).toHaveBeenCalledWith(trx)

        range(lastL2TransactionStateUpdateId).forEach((i) => {
          expect(
            mockedPreprocessedStateDetailsRepository.findByStateUpdateId
          ).toHaveBeenNthCalledWith(i * 2 + 1, i + 1, trx)

          expect(
            mockedPreprocessedStateDetailsRepository.findByStateUpdateId
          ).toHaveBeenNthCalledWith(i * 2 + 2, i, trx)
          expect(
            mockedL2TransactionRepository.getStatisticsByStateUpdateId
          ).toHaveBeenNthCalledWith(i + 1, i + 1, trx)

          expect(
            mockedPreprocessedStateDetailsRepository.update
          ).toHaveBeenNthCalledWith(
            i + 1,
            {
              id: i + 2,
              l2TransactionsStatistics:
                fakePreprocessedL2TransactionsStatistics(i + 1),
              cumulativeL2TransactionsStatistics:
                sumPreprocessedL2TransactionsStatistics(
                  fakePreprocessedStateDetailsRecord(i)
                    .cumulativeL2TransactionsStatistics!,
                  fakePreprocessedL2TransactionsStatistics(i + 1)
                ),
            },
            trx
          )
        })
      })

      it('should throw an error if no preprocessed state details record was found', async () => {
        const trx = mockObject<Knex.Transaction>()
        const catchUpToStateUpdateId = 10
        const lastL2TransactionStateUpdateId = 5
        const mockedPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            findLastWithL2TransactionsStatistics:
              mockFn().resolvesTo(undefined),
            findByStateUpdateId: mockFn().resolvesTo(undefined),
            update: mockFn().resolvesTo(1),
          })
        const mockedL2TransactionRepository =
          mockObject<L2TransactionRepository>({
            findLatestStateUpdateId: mockFn().resolvesTo(
              lastL2TransactionStateUpdateId
            ),
            getStatisticsByStateUpdateId: mockFn().resolvesTo(
              fakePreprocessedL2TransactionsStatistics()
            ),
          })
        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockedPreprocessedStateDetailsRepository,
          mockObject<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mockObject<UserTransactionRepository>(),
          mockedL2TransactionRepository
        )

        await expect(() =>
          stateDetailsPreprocessor.catchUpL2Transactions(
            trx,
            catchUpToStateUpdateId
          )
        ).toBeRejectedWith(Error)
      })

      it('should throw an error if no previous preprocessed state details record was found and id > 1', async () => {
        const trx = mockObject<Knex.Transaction>()
        const catchUpToStateUpdateId = 10
        const lastL2TransactionStateUpdateId = 5
        const mockedPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            findLastWithL2TransactionsStatistics:
              mockFn().resolvesTo(undefined),
            findByStateUpdateId: mockFn()
              .resolvesToOnce({ id: 1 } as
                | PreprocessedStateDetailsRecord
                | undefined)
              .resolvesToOnce(undefined),
            update: mockFn().resolvesTo(1),
          })
        const mockedL2TransactionRepository =
          mockObject<L2TransactionRepository>({
            findLatestStateUpdateId: mockFn().resolvesTo(
              lastL2TransactionStateUpdateId
            ),
            getStatisticsByStateUpdateId: mockFn().resolvesTo(
              fakePreprocessedL2TransactionsStatistics()
            ),
          })
        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockedPreprocessedStateDetailsRepository,
          mockObject<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mockObject<UserTransactionRepository>(),
          mockedL2TransactionRepository
        )

        await expect(() =>
          stateDetailsPreprocessor.catchUpL2Transactions(
            trx,
            catchUpToStateUpdateId
          )
        ).toBeRejectedWith(Error)
      })
    }
  )
})

function fakePreprocessedStateDetailsRecord(id: number) {
  return {
    id: id + 1,
    cumulativeL2TransactionsStatistics:
      fakePreprocessedL2TransactionsStatistics(id),
  } as PreprocessedStateDetailsRecord
}
