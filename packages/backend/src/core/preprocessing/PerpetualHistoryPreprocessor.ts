import { AssetId, StarkKey } from '@explorer/types'
import { Knex } from 'knex'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import {
  PositionRecord,
  PositionRepository,
} from '../../peripherals/database/PositionRepository'
import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { Logger } from '../../tools/Logger'
import { HistoryPreprocessor } from './HistoryPreprocessor'

export class PerpetualHistoryPreprocessor extends HistoryPreprocessor<AssetId> {
  constructor(
    private readonly collateralAsset: CollateralAsset,
    protected preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<AssetId>,
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    protected logger: Logger
  ) {
    super(preprocessedAssetHistoryRepository, logger)
  }

  async preprocessNextStateUpdate(
    trx: Knex.Transaction,
    stateUpdate: StateUpdateRecord
  ) {
    const positions = await this.positionRepository.getByStateUpdateId(
      stateUpdate.id,
      trx
    )
    const assetPriceMap = await this.getAssetPricesForStateUpdate(
      trx,
      stateUpdate.id
    )

    for (const position of positions) {
      if (position.starkKey === StarkKey.ZERO) {
        await this.closePositionOrVault(
          trx,
          position.positionId,
          stateUpdate,
          assetPriceMap
        )
      } else {
        await this.preprocessSinglePosition(
          trx,
          position,
          stateUpdate,
          assetPriceMap
        )
      }
    }
  }

  async preprocessSinglePosition(
    trx: Knex.Transaction,
    position: PositionRecord & { stateUpdateId: number },
    stateUpdate: StateUpdateRecord,
    assetPriceMap: Record<string, bigint>
  ) {
    if (position.starkKey === StarkKey.ZERO) {
      throw new Error('Cannot preprocess position with StarkKey.ZERO')
    }

    const currentUserRecords =
      await this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyAndAssets(
        position.starkKey,
        [
          this.collateralAsset.assetId,
          ...position.balances.map((b) => b.assetId),
        ],
        trx
      )

    const assetMap: Record<string, PreprocessedAssetHistoryRecord> = {}
    currentUserRecords.forEach((r) => {
      assetMap[r.assetHashOrId.toString()] = r
    })

    const updatedAssets = [
      {
        assetId: this.collateralAsset.assetId,
        balance: position.collateralBalance,
      },
      ...position.balances,
    ]

    const newRecords: Omit<
      PreprocessedAssetHistoryRecord,
      'historyId' | 'isCurrent'
    >[] = []

    updatedAssets.forEach((asset) => {
      const currentRecord = assetMap[asset.assetId.toString()]
      const currentPrice = assetPriceMap[asset.assetId.toString()]
      if (currentPrice === undefined) {
        throw new Error(`Missing price for ${asset.assetId.toString()}`)
      }
      if (currentRecord?.balance !== asset.balance) {
        newRecords.push({
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          timestamp: stateUpdate.timestamp,
          starkKey: position.starkKey,
          positionOrVaultId: position.positionId,
          assetHashOrId: asset.assetId,
          balance: asset.balance,
          prevBalance: currentRecord?.balance ?? 0n,
          price: currentPrice,
          prevPrice: currentRecord?.price,
          prevHistoryId: currentRecord?.historyId,
        })
      }
    })
    await this.addNewRecordsAndUpdateIsCurrent(trx, newRecords)
  }

  async getAssetPricesForStateUpdate(
    trx: Knex.Transaction,
    stateUpdateId: number
  ) {
    const prices = await this.stateUpdateRepository.getPricesByStateUpdateId(
      stateUpdateId,
      trx
    )
    const assetPriceMap: Record<string, bigint> = {
      [this.collateralAsset.assetId.toString()]: this.collateralAsset.price,
    }
    prices.forEach((p) => {
      assetPriceMap[p.assetId.toString()] = p.price
    })
    return assetPriceMap
  }
}
