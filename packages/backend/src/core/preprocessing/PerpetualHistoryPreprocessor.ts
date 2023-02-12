import { AssetId, StarkKey } from '@explorer/types'
import { Knex } from 'knex'

import { PositionRepository } from '../../peripherals/database/PositionRepository'
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

const COLLATERAL_TOKEN = AssetId('COLLATERAL-0')

export class PerpetualHistoryPreprocessor extends HistoryPreprocessor<AssetId> {
  constructor(
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
    const prices = await this.stateUpdateRepository.getPricesByStateUpdateId(
      stateUpdate.id,
      trx
    )
    const assetPriceMap: Record<string, bigint> = {}
    prices.forEach((p) => {
      assetPriceMap[p.asset_id.toString()] = p.price
    })
    assetPriceMap[COLLATERAL_TOKEN.toString()] = 1n

    for (const position of positions) {
      if (position.starkKey === StarkKey.ZERO) {
        await this.closePositionOrVault(
          trx,
          position.positionId,
          stateUpdate,
          assetPriceMap
        )
      } else {
        const currentUserRecords =
          await this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyAndAssets(
            position.starkKey,
            [COLLATERAL_TOKEN, ...position.balances.map((b) => b.assetId)],
            trx
          )

        const assetMap: Record<string, PreprocessedAssetHistoryRecord> = {}
        currentUserRecords.forEach((r) => {
          // TODO: remove this temporary sanity check
          if (assetMap[r.assetHashOrId.toString()] !== undefined) {
            console.log(r.assetHashOrId, position.starkKey)
            process.exit(1)
          }
          assetMap[r.assetHashOrId.toString()] = r
        })

        const updatedAssets = [
          {
            assetId: COLLATERAL_TOKEN,
            balance: position.collateralBalance,
          },
          ...position.balances,
        ]

        const newRecords: Omit<PreprocessedAssetHistoryRecord, 'historyId'>[] =
          []

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
              timestamp: BigInt(Number(stateUpdate.timestamp)),
              starkKey: position.starkKey,
              positionOrVaultId: position.positionId,
              assetHashOrId: asset.assetId,
              balance: asset.balance,
              prevBalance: currentRecord?.balance ?? 0n,
              price: currentPrice,
              prevPrice: currentRecord?.price,
              prevHistoryId: currentRecord?.historyId,
              isCurrent: true,
            })
          }
        })
        await this.addNewRecordsAndMakeThemCurrent(trx, newRecords)
      }
    }
  }
}
