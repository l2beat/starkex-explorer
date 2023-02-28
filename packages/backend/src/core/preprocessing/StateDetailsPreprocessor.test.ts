import { AssetHash, Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { expect, mockFn } from 'earljs'
import { Knex } from 'knex'

import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedStateDetailsRepository } from '../../peripherals/database/PreprocessedStateDetailsRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { mock } from '../../test/mock'
import { Logger } from '../../tools/Logger'
import { StateDetailsPreprocessor } from './StateDetailsPreprocessor'

const stateUpdate: StateUpdateRecord = {
  id: 200,
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
        const trx = mock<Knex.Transaction>()
        const mockPreprocessedAssetHistoryRepository = mock<
          PreprocessedAssetHistoryRepository<AssetHash>
        >({
          getCountByStateUpdateId: mockFn().resolvesTo(10),
        })
        const mockUserTransactionRepository = mock<UserTransactionRepository>({
          getCountOfIncludedByStateUpdateId: mockFn().resolvesTo(20),
        })
        const mockPreprocessedStateDetailsRepository =
          mock<PreprocessedStateDetailsRepository>({
            add: mockFn().resolvesTo(undefined),
          })

        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockPreprocessedStateDetailsRepository,
          mockPreprocessedAssetHistoryRepository,
          mockUserTransactionRepository,
          Logger.SILENT
        )

        await stateDetailsPreprocessor.preprocessNextStateUpdate(
          trx,
          stateUpdate
        )

        expect(
          mockPreprocessedStateDetailsRepository.add
        ).toHaveBeenCalledExactlyWith([
          [
            {
              stateUpdateId: stateUpdate.id,
              stateTransitionHash: stateUpdate.stateTransitionHash,
              rootHash: stateUpdate.rootHash,
              blockNumber: stateUpdate.blockNumber,
              timestamp: stateUpdate.timestamp,
              assetUpdateCount: 10,
              forcedTransactionCount: 20,
            },
            trx,
          ],
        ])
      })
    }
  )
  describe(
    StateDetailsPreprocessor.prototype.rollbackOneStateUpdate.name,
    () => {
      it('should delete the state details', async () => {
        const trx = mock<Knex.Transaction>()
        const mockPreprocessedStateDetailsRepository =
          mock<PreprocessedStateDetailsRepository>({
            deleteByStateUpdateId: mockFn().resolvesTo(undefined),
          })

        const stateDetailsPreprocessor = new StateDetailsPreprocessor(
          mockPreprocessedStateDetailsRepository,
          mock<PreprocessedAssetHistoryRepository<AssetHash>>(),
          mock<UserTransactionRepository>(),
          Logger.SILENT
        )

        await stateDetailsPreprocessor.rollbackOneStateUpdate(
          trx,
          stateUpdate.id
        )

        expect(
          mockPreprocessedStateDetailsRepository.deleteByStateUpdateId
        ).toHaveBeenCalledExactlyWith([[stateUpdate.id, trx]])
      })
    }
  )
})
