import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect, mockFn } from 'earljs'
import { Knex } from 'knex'

import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { mock } from '../../test/mock'
import { Logger } from '../../tools/Logger'
import { HistoryPreprocessor } from './HistoryPreprocessor'

class NonAbstractHistoryPreprocessor extends HistoryPreprocessor<AssetId> {
  async preprocessNextStateUpdate() {}
}

describe(HistoryPreprocessor.name, () => {
  describe(HistoryPreprocessor.prototype.closePositionOrVault.name, () => {
    it('should add new history records with 0 balance for all nonempty positions', async () => {
      const starkKey = StarkKey.fake()
      const trx = mock<Knex.Transaction>()
      const historyRepo = mock<PreprocessedAssetHistoryRepository<AssetId>>({
        getCurrentNonEmptyByPositionOrVaultId: async () => [
          {
            historyId: 10,
            stateUpdateId: 1_000,
            blockNumber: 1_000,
            timestamp: Timestamp(123_456_789n),
            starkKey: starkKey,
            positionOrVaultId: 5n,
            assetHashOrId: AssetId('ETH-9'),
            balance: 2_000_000n,
            prevBalance: 0n,
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
      const mockAddNewRecordsAndMakeThemCurrent = mockFn().resolvesTo([])
      preprocessor.addNewRecordsAndMakeThemCurrent =
        mockAddNewRecordsAndMakeThemCurrent

      await preprocessor.closePositionOrVault(
        trx,
        5n,
        mock<StateUpdateRecord>({
          id: 1_005,
          blockNumber: 1_005,
          timestamp: Timestamp(223_456_789n),
        }),
        {
          'ETH-9': 777_000n,
          'WBTC-9': 9_999_000n,
        }
      )
      expect(mockAddNewRecordsAndMakeThemCurrent).toHaveBeenCalledWith([
        trx,
        [
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
        ],
      ])
    })

    it('should handle case where there are no records to close', async () => {
      const historyRepo = mock<PreprocessedAssetHistoryRepository<AssetId>>({
        getCurrentNonEmptyByPositionOrVaultId: async () => [],
      })
      const preprocessor = new NonAbstractHistoryPreprocessor(
        historyRepo,
        Logger.SILENT
      )
      const mockAddNewRecordsAndMakeThemCurrent = mockFn().rejectsWith(
        new Error('should not have been called')
      )
      preprocessor.addNewRecordsAndMakeThemCurrent =
        mockAddNewRecordsAndMakeThemCurrent
      const trx = mock<Knex.Transaction>()

      await preprocessor.closePositionOrVault(
        trx,
        5n,
        mock<StateUpdateRecord>({
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
    HistoryPreprocessor.prototype.addNewRecordsAndMakeThemCurrent.name,
    () => {
      it('should clear current on old records and add new ones with isCurrent = true', async () => {
        const trx = mock<Knex.Transaction>()
        const starkKey = StarkKey.fake()
        const historyRepo = mock<PreprocessedAssetHistoryRepository<AssetId>>({
          unsetCurrentByStarkKeyAndAsset: async () => 2,
          add: async () => 2,
        })
        const preprocessor = new NonAbstractHistoryPreprocessor(
          historyRepo,
          Logger.SILENT
        )
        await preprocessor.addNewRecordsAndMakeThemCurrent(trx, [
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
        // Check that current records where set as isCurrent = false
        expect(historyRepo.unsetCurrentByStarkKeyAndAsset).toHaveBeenCalledWith(
          [starkKey, AssetId('ETH-9'), trx]
        )
        expect(historyRepo.unsetCurrentByStarkKeyAndAsset).toHaveBeenCalledWith(
          [starkKey, AssetId('WBTC-9'), trx]
        )
        expect(historyRepo.unsetCurrentByStarkKeyAndAsset.calls.length).toEqual(
          2
        )

        // Check that new records where added with isCurrent = true
        expect(historyRepo.add).toHaveBeenCalledWith([
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
            isCurrent: true,
          },
          trx,
        ])

        expect(historyRepo.add).toHaveBeenCalledWith([
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
            isCurrent: true,
          },
          trx,
        ])
        expect(historyRepo.add.calls.length).toEqual(2)
      })
    }
  )

  describe(HistoryPreprocessor.prototype.rollbackOneStateUpdate.name, () => {
    it('should delete relevant records and set current to their prevHistoryId', async () => {
      const trx = mock<Knex.Transaction>()
      const historyRepo = mock<PreprocessedAssetHistoryRepository<AssetId>>({
        getPrevHistoryIdOfCurrentWithStateUpdateId: async () => [
          { historyId: 10, prevHistoryId: 9 },
          { historyId: 100, prevHistoryId: 90 },
          { historyId: 1000, prevHistoryId: 900 },
        ],
        deleteByHistoryId: async () => 1,
        setCurrentByHistoryId: async () => 1,
      })
      const preprocessor = new NonAbstractHistoryPreprocessor(
        historyRepo,
        Logger.SILENT
      )

      await preprocessor.rollbackOneStateUpdate(trx, 123)

      expect(
        historyRepo.getPrevHistoryIdOfCurrentWithStateUpdateId
      ).toHaveBeenCalledWith([123, trx])
      expect(historyRepo.deleteByHistoryId).toHaveBeenCalledExactlyWith([
        [10, trx],
        [100, trx],
        [1000, trx],
      ])
      expect(historyRepo.setCurrentByHistoryId).toHaveBeenCalledExactlyWith([
        [9, trx],
        [90, trx],
        [900, trx],
      ])
    })
  })
})
