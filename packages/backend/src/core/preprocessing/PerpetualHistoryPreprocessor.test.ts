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
            position1,
            closingPosition,
            position2,
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
          stateUpdate
        )
        const expectedPriceMap = {
          'BTC-10': 456789n,
          'ETH-9': 123n,
          'USDC-6': 1_000_000n,
        }
        expect(mockClosePositionOrVault).toHaveBeenCalledExactlyWith([
          [trx, 10_002n, stateUpdate, expectedPriceMap],
        ])
        expect(mockPreprocessSinglePosition).toHaveBeenCalledExactlyWith([
          [trx, position1, stateUpdate, expectedPriceMap],
          [trx, position2, stateUpdate, expectedPriceMap],
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
            closingPosition,
            stateUpdate,
            {}
          )
        ).toBeRejected('Cannot preprocess position with StarkKey.ZERO')
      })

      it('should properly update history when there are only some previous records', async () => {
        const trx = mock<Knex.Transaction>()
        const preprocessedRepository = mock<
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
          mockCollateralAsset,
          preprocessedRepository,
          mock<StateUpdateRepository>(),
          mock<PositionRepository>(),
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
            [mockCollateralAsset.assetId.toString()]: mockCollateralAsset.price,
          }
        )

        expect(
          preprocessedRepository.getCurrentByPositionOrVaultId
        ).toHaveBeenCalledExactlyWith([[position1.positionId, trx]])

        expect(mockAddNewRecordsAndUpdateIsCurrent).toHaveBeenCalledExactlyWith(
          [
            [
              trx,
              [
                // There was a history entry for this record:
                {
                  assetHashOrId: mockCollateralAsset.assetId,
                  balance: position1.collateralBalance,
                  blockNumber: stateUpdate.blockNumber,
                  positionOrVaultId: position1.positionId,
                  prevBalance: 100_000_000n,
                  prevHistoryId: 100,
                  prevPrice: 1_000_000n,
                  price: mockCollateralAsset.price,
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
              ],
            ],
          ]
        )
      })
    }
  )
})
