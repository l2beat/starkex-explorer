import {
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockFn, mockObject } from 'earljs'
import { Knex } from 'knex'

import {
  PositionRecord,
  PositionRepository,
} from '../../peripherals/database/PositionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import {
  StateUpdatePriceRecord,
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { fakeCollateralAsset } from '../../test/fakes'
import { Logger } from '../../tools/Logger'
import { PerpetualHistoryPreprocessor } from './PerpetualHistoryPreprocessor'

const stateUpdate: StateUpdateRecord = {
  id: 200,
  blockNumber: 1_000,
  stateTransitionHash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  timestamp: Timestamp(1_000_000_000),
}

const position1: PositionRecord & { stateUpdateId: number } = {
  stateUpdateId: 2_000,
  positionId: 10_001n,
  starkKey: StarkKey.fake(),
  collateralBalance: -144210511600n,
  balances: [
    {
      assetId: AssetId('ETH-9'),
      balance: 47_198_000_000n,
    },
    {
      assetId: AssetId('BTC-10'),
      balance: -40_000_000_000n,
    },
  ],
}

const closingPosition: PositionRecord & { stateUpdateId: number } = {
  stateUpdateId: 2_000,
  positionId: 10_002n,
  starkKey: StarkKey(
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  ),
  collateralBalance: 0n,
  balances: [],
}

const position2: PositionRecord & { stateUpdateId: number } = {
  stateUpdateId: 2_000,
  positionId: 10_003n,
  starkKey: StarkKey.fake(),
  collateralBalance: -74841147102n,
  balances: [
    {
      assetId: AssetId('ETH-9'),
      balance: 28_000_000_000n,
    },
    {
      assetId: AssetId('BTC-10'),
      balance: 25_000_000_000n,
    },
  ],
}

describe(PerpetualHistoryPreprocessor.name, () => {
  describe(
    PerpetualHistoryPreprocessor.prototype.getAssetPricesForStateUpdate.name,
    () => {
      it('should return a map of asset prices for a given state update id', async () => {
        const stateUpdateRepository = mockObject<StateUpdateRepository>({
          getPricesByStateUpdateId: async (): Promise<
            StateUpdatePriceRecord[]
          > => [
            { assetId: AssetId('ETH-9'), price: 123n },
            { assetId: AssetId('BTC-10'), price: 456_789n },
          ],
        })
        const preprocessor = new PerpetualHistoryPreprocessor(
          fakeCollateralAsset,
          mockObject<PreprocessedAssetHistoryRepository<AssetId>>(),
          stateUpdateRepository,
          mockObject<PositionRepository>(),
          Logger.SILENT
        )
        const pricesMap = await preprocessor.getAssetPricesForStateUpdate(
          mockObject<Knex.Transaction>(),
          100
        )
        expect(pricesMap).toEqual({
          'ETH-9': 123n,
          'BTC-10': 456_789n,
          [fakeCollateralAsset.assetId.toString()]: fakeCollateralAsset.price,
        })
      })
    }
  )

  describe(
    PerpetualHistoryPreprocessor.prototype.preprocessNextStateUpdate.name,
    () => {
      it('should close position when starkKey is ZERO, process otherwise', async () => {
        const trx = mockObject<Knex.Transaction>()
        const positionRepository = mockObject<PositionRepository>({
          getByStateUpdateId: async () => [
            position1,
            closingPosition,
            position2,
          ],
        })
        const stateUpdateRepository = mockObject<StateUpdateRepository>({
          getPricesByStateUpdateId: async (): Promise<
            StateUpdatePriceRecord[]
          > => [
            { assetId: AssetId('ETH-9'), price: 123n },
            { assetId: AssetId('BTC-10'), price: 456_789n },
          ],
        })

        const perpetualHistoryPreprocessor = new PerpetualHistoryPreprocessor(
          fakeCollateralAsset,
          mockObject<PreprocessedAssetHistoryRepository<AssetId>>(),
          stateUpdateRepository,
          positionRepository,
          Logger.SILENT
        )
        const mockPreprocessSinglePosition = mockFn().resolvesTo(undefined)
        perpetualHistoryPreprocessor.preprocessSinglePosition =
          mockPreprocessSinglePosition
        const mockClosePositionOrVault = mockFn().resolvesTo(undefined)
        perpetualHistoryPreprocessor.closePositionOrVault =
          mockClosePositionOrVault

        await perpetualHistoryPreprocessor.preprocessNextStateUpdate(
          trx,
          stateUpdate
        )
        const expectedPriceMap = {
          'BTC-10': 456789n,
          'ETH-9': 123n,
          'USDC-6': 1_000_000n,
        }
        expect(mockClosePositionOrVault).toHaveBeenOnlyCalledWith(
          trx,
          10_002n,
          stateUpdate,
          expectedPriceMap
        )
        expect(mockPreprocessSinglePosition).toHaveBeenCalledTimes(2)
        expect(mockPreprocessSinglePosition).toHaveBeenNthCalledWith(
          1,
          trx,
          position1,
          stateUpdate,
          expectedPriceMap
        )
        expect(mockPreprocessSinglePosition).toHaveBeenNthCalledWith(
          2,
          trx,
          position2,
          stateUpdate,
          expectedPriceMap
        )
      })
    }
  )

  describe(
    PerpetualHistoryPreprocessor.prototype.preprocessSinglePosition.name,
    () => {
      it('fails if position has StarkKey.ZERO', async () => {
        const perpetualHistoryPreprocessor = new PerpetualHistoryPreprocessor(
          fakeCollateralAsset,
          mockObject<PreprocessedAssetHistoryRepository<AssetId>>(),
          mockObject<StateUpdateRepository>(),
          mockObject<PositionRepository>(),
          Logger.SILENT
        )
        await expect(
          perpetualHistoryPreprocessor.preprocessSinglePosition(
            mockObject<Knex.Transaction>(),
            closingPosition,
            stateUpdate,
            {}
          )
        ).toBeRejectedWith('Cannot preprocess position with StarkKey.ZERO')
      })

      it('should properly update history when there are only some previous records', async () => {
        const trx = mockObject<Knex.Transaction>()
        const preprocessedRepository = mockObject<
          PreprocessedAssetHistoryRepository<AssetId>
        >({
          getCurrentByPositionOrVaultId: async () => [
            {
              historyId: 100,
              stateUpdateId: 1900,
              blockNumber: 9_000_000,
              timestamp: Timestamp(900_000_000n),
              starkKey: position1.starkKey,
              positionOrVaultId: position1.positionId,
              assetHashOrId: fakeCollateralAsset.assetId,
              balance: 100_000_000n,
              prevBalance: 900_000_000n,
              price: fakeCollateralAsset.price,
              prevPrice: 234_456n,
              isCurrent: true,
              prevHistoryId: 99,
            },
            {
              historyId: 80,
              stateUpdateId: 1840,
              blockNumber: 1_000_000,
              timestamp: Timestamp(800_000_000n),
              starkKey: position1.starkKey,
              positionOrVaultId: position1.positionId,
              assetHashOrId: AssetId('BTC-10'),
              balance: 600_000n,
              prevBalance: 700_000n,
              price: 345_678n,
              prevPrice: undefined,
              isCurrent: true,
              prevHistoryId: undefined,
            },
            {
              historyId: 70,
              stateUpdateId: 1700,
              blockNumber: 700_000,
              timestamp: Timestamp(700_000_000n),
              starkKey: position1.starkKey,
              positionOrVaultId: position1.positionId,
              assetHashOrId: AssetId('SOL-7'),
              balance: 5_000_000n,
              prevBalance: 7_000_000n,
              price: 10_123n,
              prevPrice: 9_999n,
              isCurrent: true,
              prevHistoryId: 69,
            },
          ],
        })

        const perpetualHistoryPreprocessor = new PerpetualHistoryPreprocessor(
          fakeCollateralAsset,
          preprocessedRepository,
          mockObject<StateUpdateRepository>(),
          mockObject<PositionRepository>(),
          Logger.SILENT
        )
        const mockAddNewRecordsAndUpdateIsCurrent =
          mockFn().resolvesTo(undefined)
        perpetualHistoryPreprocessor.addNewRecordsAndUpdateIsCurrent =
          mockAddNewRecordsAndUpdateIsCurrent

        await perpetualHistoryPreprocessor.preprocessSinglePosition(
          trx,
          position1,
          stateUpdate,
          {
            'BTC-10': 456789n,
            'ETH-9': 123n,
            'SOL-7': 11_000n,
            [fakeCollateralAsset.assetId.toString()]: fakeCollateralAsset.price,
          }
        )

        expect(
          preprocessedRepository.getCurrentByPositionOrVaultId
        ).toHaveBeenOnlyCalledWith(position1.positionId, trx)

        expect(mockAddNewRecordsAndUpdateIsCurrent).toHaveBeenOnlyCalledWith(
          trx,
          [
            // There was a history entry for this record:
            {
              assetHashOrId: fakeCollateralAsset.assetId,
              balance: position1.collateralBalance,
              blockNumber: stateUpdate.blockNumber,
              positionOrVaultId: position1.positionId,
              prevBalance: 100_000_000n,
              prevHistoryId: 100,
              prevPrice: 1_000_000n,
              price: fakeCollateralAsset.price,
              starkKey: position1.starkKey,
              stateUpdateId: stateUpdate.id,
              timestamp: stateUpdate.timestamp,
            },
            // There was no history entry for this record:
            {
              assetHashOrId: AssetId('ETH-9'),
              balance: 47_198_000_000n,
              blockNumber: stateUpdate.blockNumber,
              positionOrVaultId: position1.positionId,
              prevBalance: 0n,
              prevHistoryId: undefined,
              prevPrice: undefined,
              price: 123n,
              starkKey: position1.starkKey,
              stateUpdateId: stateUpdate.id,
              timestamp: stateUpdate.timestamp,
            },
            // There was a history entry for this record:
            {
              assetHashOrId: AssetId('BTC-10'),
              balance: -40_000_000_000n,
              blockNumber: stateUpdate.blockNumber,
              positionOrVaultId: position1.positionId,
              prevBalance: 600_000n,
              prevHistoryId: 80,
              prevPrice: 345_678n,
              price: 456_789n,
              starkKey: position1.starkKey,
              stateUpdateId: stateUpdate.id,
              timestamp: stateUpdate.timestamp,
            },
            // There was a history entry but not in position,
            // so balance needs to be set to 0:
            {
              assetHashOrId: AssetId('SOL-7'),
              balance: 0n,
              blockNumber: stateUpdate.blockNumber,
              starkKey: position1.starkKey,
              positionOrVaultId: position1.positionId,
              prevBalance: 5_000_000n,
              price: 11_000n,
              prevPrice: 10_123n,
              prevHistoryId: 70,
              stateUpdateId: stateUpdate.id,
              timestamp: stateUpdate.timestamp,
            },
          ]
        )
      })
    }
  )
})
