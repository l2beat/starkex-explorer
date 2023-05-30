import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { Knex } from 'knex'

import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { Logger } from '../../tools/Logger'
import { HistoryPreprocessor } from './HistoryPreprocessor'

class NonAbstractHistoryPreprocessor extends HistoryPreprocessor<AssetId> {
  async preprocessNextStateUpdate() {}
}

describe(HistoryPreprocessor.name, () => {
  describe(HistoryPreprocessor.prototype.closePositionOrVault.name, () => {
    it('should add new history records with 0 balance for all nonempty positions', async () => {
      const starkKey = StarkKey.fake()
      const trx = mockObject<Knex.Transaction>()
      const historyRepo = mockObject<
        PreprocessedAssetHistoryRepository<AssetId>
      >({
        getCurrentByPositionOrVaultId: async () => [
          {
            historyId: 10,
            stateUpdateId: 1_000,
            blockNumber: 1_000,
            timestamp: Timestamp(123_456_789n),
            starkKey: starkKey,
            positionOrVaultId: 5n,
            assetHashOrId: AssetId('ETH-9'),
            balance: 2_000_000n,
            prevBalance: 800_000n,
            price: 666_000n,
            prevPrice: undefined,
            isCurrent: true,
            prevHistoryId: undefined,
          },
          {
            historyId: 13,
            stateUpdateId: 1_000,
            blockNumber: 1_000,
            timestamp: Timestamp(123_456_789n),
            starkKey: starkKey,
            positionOrVaultId: 5n,
            assetHashOrId: AssetId('WBTC-9'),
            balance: 3_000_000n,
            prevBalance: 1_000_000n,
            price: 8_888_000n,
            prevPrice: 7_777_000n,
            isCurrent: true,
            prevHistoryId: 12,
          },
        ],
      })
      const preprocessor = new NonAbstractHistoryPreprocessor(
        historyRepo,
        Logger.SILENT
      )
      const mockAddNewRecordsAndUpdateIsCurrent = mockFn().resolvesTo([])
      preprocessor.addNewRecordsAndUpdateIsCurrent =
        mockAddNewRecordsAndUpdateIsCurrent

      await preprocessor.closePositionOrVault(
        trx,
        5n,
        mockObject<StateUpdateRecord>({
          id: 1_005,
          blockNumber: 1_005,
          timestamp: Timestamp(223_456_789n),
        }),
        {
          'ETH-9': 777_000n,
          'WBTC-9': 9_999_000n,
        }
      )
      expect(mockAddNewRecordsAndUpdateIsCurrent).toHaveBeenCalledWith(trx, [
        {
          assetHashOrId: AssetId('ETH-9'),
          balance: 0n,
          blockNumber: 1_005,
          positionOrVaultId: 5n,
          prevBalance: 2_000_000n,
          prevHistoryId: 10,
          prevPrice: 666_000n,
          price: 777_000n,
          starkKey: starkKey,
          stateUpdateId: 1_005,
          timestamp: Timestamp(223_456_789n),
        },
        {
          assetHashOrId: AssetId('WBTC-9'),
          balance: 0n,
          blockNumber: 1_005,
          positionOrVaultId: 5n,
          prevBalance: 3_000_000n,
          prevHistoryId: 13,
          prevPrice: 8_888_000n,
          price: 9_999_000n,
          starkKey: starkKey,
          stateUpdateId: 1_005,
          timestamp: Timestamp(223_456_789n),
        },
      ])
    })

    it('should handle case where there are no records to close', async () => {
      const historyRepo = mockObject<
        PreprocessedAssetHistoryRepository<AssetId>
      >({
        getCurrentByPositionOrVaultId: async () => [],
      })
      const preprocessor = new NonAbstractHistoryPreprocessor(
        historyRepo,
        Logger.SILENT
      )
      const mockAddNewRecordsAndUpdateIsCurrent = mockFn().rejectsWith(
        new Error('should not have been called')
      )
      preprocessor.addNewRecordsAndUpdateIsCurrent =
        mockAddNewRecordsAndUpdateIsCurrent
      const trx = mockObject<Knex.Transaction>()

      await preprocessor.closePositionOrVault(
        trx,
        5n,
        mockObject<StateUpdateRecord>({
          id: 1_005,
          blockNumber: 1_005,
          timestamp: Timestamp(223_456_789n),
        }),
        {
          'ETH-9': 777_000n,
          'WBTC-9': 9_999_000n,
        }
      )
    })
  })

  describe(
    HistoryPreprocessor.prototype.addNewRecordsAndUpdateIsCurrent.name,
    () => {
      it('should clear isCurrent on old records and set on new ones with balance > 0', async () => {
        const trx = mockObject<Knex.Transaction>()
        const starkKey = StarkKey.fake()
        const historyRepo = mockObject<
          PreprocessedAssetHistoryRepository<AssetId>
        >({
          updateCurrentByPositionOrVaultIdAndAsset: async () => 2,
          add: async () => 2,
        })
        const preprocessor = new NonAbstractHistoryPreprocessor(
          historyRepo,
          Logger.SILENT
        )
        await preprocessor.addNewRecordsAndUpdateIsCurrent(trx, [
          {
            assetHashOrId: AssetId('ETH-9'),
            balance: 100_000n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 2_000_000n,
            prevHistoryId: 10,
            prevPrice: 666_000n,
            price: 777_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
          },
          {
            assetHashOrId: AssetId('WBTC-9'),
            balance: 0n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 3_000_000n,
            prevHistoryId: 13,
            prevPrice: 8_888_000n,
            price: 9_999_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
          },
        ])
        // Check that current records where set as isCurrent = false
        expect(
          historyRepo.updateCurrentByPositionOrVaultIdAndAsset
        ).toHaveBeenNthCalledWith(
          1,
          {
            isCurrent: true,
            positionOrVaultId: 5n,
            asset: AssetId('ETH-9'),
          },
          trx
        )
        expect(
          historyRepo.updateCurrentByPositionOrVaultIdAndAsset
        ).toHaveBeenNthCalledWith(
          2,
          {
            isCurrent: true,
            positionOrVaultId: 5n,
            asset: AssetId('WBTC-9'),
          },
          trx
        )

        expect(historyRepo.add).toHaveBeenCalledTimes(2)
        // Check that new records where added with correct isCurrent
        expect(historyRepo.add).toHaveBeenNthCalledWith(
          1,
          {
            assetHashOrId: AssetId('ETH-9'),
            balance: 100_000n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 2_000_000n,
            prevHistoryId: 10,
            prevPrice: 666_000n,
            price: 777_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
            isCurrent: true,
          },
          trx
        )
        // When balance = 0, isCurrent should be set to false
        expect(historyRepo.add).toHaveBeenNthCalledWith(
          2,
          {
            assetHashOrId: AssetId('WBTC-9'),
            balance: 0n,
            blockNumber: 1_005,
            positionOrVaultId: 5n,
            prevBalance: 3_000_000n,
            prevHistoryId: 13,
            prevPrice: 8_888_000n,
            price: 9_999_000n,
            starkKey: starkKey,
            stateUpdateId: 1_005,
            timestamp: Timestamp(223_456_789n),
            isCurrent: false,
          },
          trx
        )
      })
    }
  )

  describe(HistoryPreprocessor.prototype.rollbackOneStateUpdate.name, () => {
    it('should delete relevant records and set current to their prevHistoryId', async () => {
      const trx = mockObject<Knex.Transaction>()
      const historyRepo = mockObject<
        PreprocessedAssetHistoryRepository<AssetId>
      >({
        getPrevHistoryByStateUpdateId: async () => [
          { historyId: 10, prevHistoryId: 9 },
          { historyId: 100, prevHistoryId: 90 },
          { historyId: 1000, prevHistoryId: 900 },
          { historyId: 10000, prevHistoryId: undefined },
        ],
        deleteByHistoryId: async () => 1,
        updateAsCurrentByHistoryId: async () => 1,
      })
      const preprocessor = new NonAbstractHistoryPreprocessor(
        historyRepo,
        Logger.SILENT
      )

      await preprocessor.rollbackOneStateUpdate(trx, 123)

      expect(
        historyRepo.getPrevHistoryByStateUpdateId
      ).toHaveBeenOnlyCalledWith(123, trx)

      expect(historyRepo.deleteByHistoryId).toHaveBeenCalledTimes(4)
      expect(historyRepo.deleteByHistoryId).toHaveBeenNthCalledWith(1, 10, trx)
      expect(historyRepo.deleteByHistoryId).toHaveBeenNthCalledWith(2, 100, trx)
      expect(historyRepo.deleteByHistoryId).toHaveBeenNthCalledWith(
        3,
        1000,
        trx
      )
      expect(historyRepo.deleteByHistoryId).toHaveBeenNthCalledWith(
        4,
        10000,
        trx
      )

      expect(historyRepo.updateAsCurrentByHistoryId).toHaveBeenCalledTimes(3)
      expect(historyRepo.updateAsCurrentByHistoryId).toHaveBeenNthCalledWith(
        1,
        { historyId: 9, isCurrent: true },
        trx
      )
      expect(historyRepo.updateAsCurrentByHistoryId).toHaveBeenNthCalledWith(
        2,
        { historyId: 90, isCurrent: true },
        trx
      )
      expect(historyRepo.updateAsCurrentByHistoryId).toHaveBeenNthCalledWith(
        3,
        { historyId: 900, isCurrent: true },
        trx
      )
    })
  })
})
