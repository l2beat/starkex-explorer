import { AssetHash, Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
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
      it('catches up', async () => {
        const trx = mockObject<Knex.Transaction>()
        const recordsToUpdate: PreprocessedStateDetailsRecord[] = [
          {
            id: 1,
            stateUpdateId: 200,
          } as PreprocessedStateDetailsRecord,
          {
            id: 3,
            stateUpdateId: 250,
          } as PreprocessedStateDetailsRecord,
          {
            id: 5,
            stateUpdateId: 400,
          } as PreprocessedStateDetailsRecord,
        ]
        const preprocessToStateUpdateId = 200
        const mockedPreprocessedStateDetailsRepository =
          mockObject<PreprocessedStateDetailsRepository>({
            getAllWithoutL2TransactionStatisticsUpToStateUpdateId:
              mockFn().resolvesTo(recordsToUpdate),
            update: mockFn().resolvesTo(1),
          })
        const mockedL2TransactionRepository =
          mockObject<L2TransactionRepository>({
            getStatisticsByStateUpdateId: mockFn(
              async (stateUpdateId: number) =>
                fakePreprocessedL2TransactionsStatistics(stateUpdateId)
            ),
            getStatisticsUpToStateUpdateId: mockFn(
              async (stateUpdateId: number) =>
                fakePreprocessedL2TransactionsStatistics(stateUpdateId + 1)
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
          preprocessToStateUpdateId
        )

        expect(
          mockedPreprocessedStateDetailsRepository.getAllWithoutL2TransactionStatisticsUpToStateUpdateId
        ).toHaveBeenCalledWith(preprocessToStateUpdateId, trx)

        for (const recordToUpdate of recordsToUpdate) {
          expect(
            mockedL2TransactionRepository.getStatisticsByStateUpdateId
          ).toHaveBeenCalledWith(recordToUpdate.stateUpdateId, trx)

          expect(
            mockedL2TransactionRepository.getStatisticsUpToStateUpdateId
          ).toHaveBeenCalledWith(recordToUpdate.stateUpdateId, trx)

          expect(
            mockedPreprocessedStateDetailsRepository.update(
              {
                id: recordToUpdate.id,
                l2TransactionsStatistics:
                  fakePreprocessedL2TransactionsStatistics(
                    recordToUpdate.stateUpdateId
                  ),
                cumulativeL2TransactionsStatistics:
                  fakePreprocessedL2TransactionsStatistics(
                    recordToUpdate.stateUpdateId + 1
                  ),
              },
              trx
            )
          )
        }
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
