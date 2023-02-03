import { StarkKey } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedAssetHistoryRow } from 'knex/types/tables'

import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { Logger } from '../../tools/Logger'

const COLLATERAL_TOKEN = 'USDC'

export class PerpetualHistoryPreprocessor {
  constructor(
    private preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
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
    const tokenPriceMap: Record<string, bigint> = {}
    prices.forEach((p) => {
      tokenPriceMap[p.asset_id.toString()] = p.price
    })
    tokenPriceMap[COLLATERAL_TOKEN] = 1n

    for (const position of positions) {
      const currentUserRecords =
        position.starkKey === StarkKey.ZERO
          ? await this.preprocessedAssetHistoryRepository.getCurrentNonEmptyByStarkKey(
              position.starkKey,
              trx
            )
          : await this.preprocessedAssetHistoryRepository.getCurrentByStarkKeyAndTokenIds(
              position.starkKey,
              position.balances.map((b) => b.assetId.toString()),
              trx
            )

      const tokenMap: Record<string, PreprocessedAssetHistoryRow> = {}
      currentUserRecords.forEach((r) => {
        if (tokenMap[r.token] !== undefined) {
          console.log(r.token, position.starkKey)
          process.exit(1)
        }
        tokenMap[r.token] = r
      })

      const updatedAssets =
        position.starkKey === StarkKey.ZERO
          ? [
              { assetId: COLLATERAL_TOKEN, balance: 0n },
              ...currentUserRecords.map((r) => ({
                assetId: r.token,
                balance: 0n,
              })),
            ]
          : [
              {
                assetId: COLLATERAL_TOKEN,
                balance: position.collateralBalance,
              },
              ...position.balances,
            ]

      const newRecords: Omit<PreprocessedAssetHistoryRow, 'id'>[] = []

      updatedAssets.forEach((asset) => {
        const currentRecord = tokenMap[asset.assetId.toString()]
        const currentPrice = tokenPriceMap[asset.assetId.toString()]
        if (currentPrice === undefined) {
          throw new Error('Error')
        }
        if (currentRecord?.balance !== asset.balance) {
          newRecords.push({
            state_update_id: stateUpdate.id,
            block_number: stateUpdate.blockNumber,
            timestamp: BigInt(Number(stateUpdate.timestamp)),
            stark_key: position.starkKey.toString(),
            position_or_vault_id: position.positionId,
            token: asset.assetId.toString(),
            token_is_perp: false, // TODO: fix
            balance: asset.balance,
            prev_balance: currentRecord?.balance ?? 0n,
            price: currentPrice,
            prev_price: currentRecord?.price ?? null,
            prev_history_id: currentRecord?.id ?? null,
            is_current: true,
          })
        }
      })

      if (newRecords.length > 0) {
        await this.preprocessedAssetHistoryRepository.unsetCurrentByStarkKeyAndTokenIds(
          position.starkKey,
          newRecords.map((r) => r.token),
          trx
        )
        // Using loop because this call doesn't respect transaction(!!!!):
        // await this.preprocessedAssetHistoryRepository.addMany(newRecords, trx)
        for (const record of newRecords) {
          await this.preprocessedAssetHistoryRepository.add(record, trx)
        }
      }
    }
  }

  async rollbackOneStateUpdate(trx: Knex.Transaction) {}
}
