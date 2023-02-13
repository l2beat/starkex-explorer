import {
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockFn } from 'earljs'
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
import { mock } from '../../test/mock'
import { Logger } from '../../tools/Logger'
import { PerpetualHistoryPreprocessor } from './PerpetualHistoryPreprocessor'

const mockStateUpdate: StateUpdateRecord = {
  id: 200,
  blockNumber: 1_000,
  stateTransitionHash: Hash256.fake(),
  rootHash: PedersenHash.fake(),
  timestamp: Timestamp(1_000_000_000),
}

const mockPosition1: PositionRecord & { stateUpdateId: number } = {
  stateUpdateId: 2000,
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

const mockZeroPosition: PositionRecord & { stateUpdateId: number } = {
  stateUpdateId: 2000,
  positionId: 10_002n,
  starkKey: StarkKey(
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  ),
  collateralBalance: 0n,
  balances: [],
}

const mockPosition2: PositionRecord & { stateUpdateId: number } = {
  stateUpdateId: 2000,
  positionId: 10_003n,
  starkKey: StarkKey.fake(),
  collateralBalance: -74841147102n,
  balances: [
    {
      assetId: AssetId('ETH-9'),
      balance: 28000000000n,
    },
    {
      assetId: AssetId('BTC-10'),
      balance: 25000000000n,
    },
  ],
}

const mockCollateralAsset = {
  assetId: AssetId.USDC,
  price: 1_000_000n,
}

describe(PerpetualHistoryPreprocessor.name, () => {
  describe(
    PerpetualHistoryPreprocessor.prototype.getAssetPricesForStateUpdate.name,
    () => {
      it('should return a map of asset prices for a given state update id', async () => {
        const stateUpdateRepository = mock<StateUpdateRepository>({
          getPricesByStateUpdateId: async (): Promise<
            StateUpdatePriceRecord[]
          > => [
            { assetId: AssetId('ETH-9'), price: 123n },
            { assetId: AssetId('BTC-10'), price: 456_789n },
          ],
        })
        const preprocessor = new PerpetualHistoryPreprocessor(
          mockCollateralAsset,
          mock<PreprocessedAssetHistoryRepository<AssetId>>(),
          stateUpdateRepository,
          mock<PositionRepository>(),
          Logger.SILENT
        )
        const pricesMap = await preprocessor.getAssetPricesForStateUpdate(
          mock<Knex.Transaction>(),
          100
        )
        expect(pricesMap).toEqual({
          'ETH-9': 123n,
          'BTC-10': 456_789n,
          [mockCollateralAsset.assetId.toString()]: mockCollateralAsset.price,
        })
      })
    }
  )

  describe(
    PerpetualHistoryPreprocessor.prototype.preprocessNextStateUpdate.name,
    () => {
      it('should close position when starkKey is ZERO, process otherwise', async () => {
        const trx = mock<Knex.Transaction>()
        const positionRepository = mock<PositionRepository>({
          getByStateUpdateId: async () => [
            mockPosition1,
            mockZeroPosition,
            mockPosition2,
          ],
        })
        const stateUpdateRepository = mock<StateUpdateRepository>({
          getPricesByStateUpdateId: async (): Promise<
            StateUpdatePriceRecord[]
          > => [
            { assetId: AssetId('ETH-9'), price: 123n },
            { assetId: AssetId('BTC-10'), price: 456_789n },
          ],
        })

        const perpetualHistoryPreprocessor = new PerpetualHistoryPreprocessor(
          mockCollateralAsset,
          mock<PreprocessedAssetHistoryRepository<AssetId>>(),
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
          mockStateUpdate
        )
        const expectedPriceMap = {
          'BTC-10': 456789n,
          'ETH-9': 123n,
          'USDC-6': 1_000_000n,
        }
        expect(mockClosePositionOrVault).toHaveBeenCalledExactlyWith([
          [trx, 10_002n, mockStateUpdate, expectedPriceMap],
        ])
        expect(mockPreprocessSinglePosition).toHaveBeenCalledExactlyWith([
          [trx, mockPosition1, mockStateUpdate, expectedPriceMap],
          [trx, mockPosition2, mockStateUpdate, expectedPriceMap],
        ])
      })
    }
  )

  describe(
    PerpetualHistoryPreprocessor.prototype.preprocessSinglePosition.name,
    () => {
      it('fails if position has StarkKey.ZERO', async () => {
        const perpetualHistoryPreprocessor = new PerpetualHistoryPreprocessor(
          mockCollateralAsset,
          mock<PreprocessedAssetHistoryRepository<AssetId>>(),
          mock<StateUpdateRepository>(),
          mock<PositionRepository>(),
          Logger.SILENT
        )
        await expect(
          perpetualHistoryPreprocessor.preprocessSinglePosition(
            mock<Knex.Transaction>(),
            mockZeroPosition,
            mockStateUpdate,
            {}
          )
        ).toBeRejected('Cannot preprocess position with StarkKey.ZERO')
      })

      it('should properly update history when there are only some previous records', async () => {
        const trx = mock<Knex.Transaction>()
        const preprocessedRepository = mock<
          PreprocessedAssetHistoryRepository<AssetId>
        >({
          getCurrentByStarkKeyAndAssets: async () => [
            {
              historyId: 100,
              stateUpdateId: 1900,
              blockNumber: 1_000_000,
              timestamp: Timestamp(900_000_000n),
              starkKey: mockPosition1.starkKey,
              positionOrVaultId: mockPosition1.positionId,
              assetHashOrId: mockCollateralAsset.assetId,
              balance: 100_000_000n,
              prevBalance: 900_000_000n,
              price: mockCollateralAsset.price,
              prevPrice: 234_456n,
              isCurrent: true,
              prevHistoryId: 99,
            },
            {
              historyId: 80,
              stateUpdateId: 1940,
              blockNumber: 9000_000,
              timestamp: Timestamp(900_000_000n),
              starkKey: mockPosition1.starkKey,
              positionOrVaultId: mockPosition1.positionId,
              assetHashOrId: AssetId('BTC-10'),
              balance: 0n,
              prevBalance: 700_000n,
              price: 345_678n,
              prevPrice: undefined,
              isCurrent: true,
              prevHistoryId: undefined,
            },
          ],
        })

        const perpetualHistoryPreprocessor = new PerpetualHistoryPreprocessor(
          mockCollateralAsset,
          preprocessedRepository,
          mock<StateUpdateRepository>(),
          mock<PositionRepository>(),
          Logger.SILENT
        )
        const mockAddNewRecordsAndMakeThemCurrent =
          mockFn().resolvesTo(undefined)
        perpetualHistoryPreprocessor.addNewRecordsAndMakeThemCurrent =
          mockAddNewRecordsAndMakeThemCurrent

        await perpetualHistoryPreprocessor.preprocessSinglePosition(
          trx,
          mockPosition1,
          mockStateUpdate,
          {
            'BTC-10': 456789n,
            'ETH-9': 123n,
            [mockCollateralAsset.assetId.toString()]: mockCollateralAsset.price,
          }
        )

        expect(
          preprocessedRepository.getCurrentByStarkKeyAndAssets
        ).toHaveBeenCalledExactlyWith([
          [
            mockPosition1.starkKey,
            [AssetId.USDC, AssetId('ETH-9'), AssetId('BTC-10')],
            trx,
          ],
        ])

        expect(mockAddNewRecordsAndMakeThemCurrent).toHaveBeenCalledExactlyWith(
          [
            [
              trx,
              [
                // There was a history entry for this record:
                {
                  assetHashOrId: mockCollateralAsset.assetId,
                  balance: mockPosition1.collateralBalance,
                  blockNumber: mockStateUpdate.blockNumber,
                  positionOrVaultId: mockPosition1.positionId,
                  prevBalance: 100_000_000n,
                  prevHistoryId: 100,
                  prevPrice: 1_000_000n,
                  price: mockCollateralAsset.price,
                  starkKey: mockPosition1.starkKey,
                  stateUpdateId: mockStateUpdate.id,
                  timestamp: mockStateUpdate.timestamp,
                },
                // There was no history entry for this record:
                {
                  assetHashOrId: AssetId('ETH-9'),
                  balance: 47198000000n,
                  blockNumber: mockStateUpdate.blockNumber,
                  positionOrVaultId: mockPosition1.positionId,
                  prevBalance: 0n,
                  prevHistoryId: undefined,
                  prevPrice: undefined,
                  price: 123n,
                  starkKey: mockPosition1.starkKey,
                  stateUpdateId: mockStateUpdate.id,
                  timestamp: mockStateUpdate.timestamp,
                },
                // There was a history entry for this record with no balance:
                {
                  assetHashOrId: AssetId('BTC-10'),
                  balance: -40000000000n,
                  blockNumber: mockStateUpdate.blockNumber,
                  positionOrVaultId: mockPosition1.positionId,
                  prevBalance: 0n,
                  prevHistoryId: 80,
                  prevPrice: 345_678n,
                  price: 456_789n,
                  starkKey: mockPosition1.starkKey,
                  stateUpdateId: mockStateUpdate.id,
                  timestamp: mockStateUpdate.timestamp,
                },
              ],
            ],
          ]
        )
      })
    }
  )
})
