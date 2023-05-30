import { AssetHash, AssetId } from '@explorer/types'
import { Knex } from 'knex'

import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { Logger } from '../../tools/Logger'

export abstract class HistoryPreprocessor<T extends AssetHash | AssetId> {
  constructor(
    protected preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<T>,
    protected logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  abstract preprocessNextStateUpdate(
    trx: Knex.Transaction,
    stateUpdate: StateUpdateRecord
  ): Promise<void>

  // Closing a position or vault is a special case because the state update
  // has StarkKey set to ZERO and all assets empty, so we need to retrieve it
  // all from history
  async closePositionOrVault(
    trx: Knex.Transaction,
    positionOrVaultId: bigint,
    stateUpdate: StateUpdateRecord,
    assetPrices: Record<string, bigint>
  ) {
    const recordsToClose =
      await this.preprocessedAssetHistoryRepository.getCurrentByPositionOrVaultId(
        positionOrVaultId,
        trx
      )

    if (recordsToClose[0] !== undefined) {
      const starkKey = recordsToClose[0].starkKey
      const newRecords: Omit<
        PreprocessedAssetHistoryRecord<T>,
        'historyId' | 'isCurrent'
      >[] = recordsToClose.map((record) => ({
        stateUpdateId: stateUpdate.id,
        blockNumber: stateUpdate.blockNumber,
        timestamp: stateUpdate.timestamp,
        starkKey: starkKey,
        positionOrVaultId: positionOrVaultId,
        assetHashOrId: record.assetHashOrId,
        balance: 0n,
        prevBalance: record.balance,
        price: assetPrices[record.assetHashOrId.toString()],
        prevPrice: record.price,
        prevHistoryId: record.historyId,
      }))
      await this.addNewRecordsAndUpdateIsCurrent(trx, newRecords)
    }
  }

  async addNewRecordsAndUpdateIsCurrent(
    trx: Knex.Transaction,
    newRecords: Omit<
      PreprocessedAssetHistoryRecord<T>,
      'historyId' | 'isCurrent'
    >[]
  ) {
    for (const record of newRecords) {
      await this.preprocessedAssetHistoryRepository.updateCurrentByPositionOrVaultIdAndAsset(
        {
          isCurrent: false,
          positionOrVaultId: record.positionOrVaultId,
          asset: record.assetHashOrId,
        },
        trx
      )

      // We want to set isCurrent to false for records that bring asset balance
      // down to 0. We have no guarantee that when the user deposits
      // the same asset again in the future, it will come to the same vault.
      // So we don't want then to connect prevHistoryId to the current closed
      // record.
      const recordAsCurrent: Omit<
        PreprocessedAssetHistoryRecord<T>,
        'historyId'
      > = {
        ...record,
        isCurrent: record.balance !== 0n,
      }
      await this.preprocessedAssetHistoryRepository.add(recordAsCurrent, trx)
    }
  }

  async rollbackOneStateUpdate(
    trx: Knex.Transaction,
    lastProcessedStateUpdateId: number
  ) {
    const recordsToRollback =
      // We need to fetch all records for stateUpdateId, even those that
      // have isCurrent = false (this can happen when balance is set to 0).
      await this.preprocessedAssetHistoryRepository.getPrevHistoryByStateUpdateId(
        lastProcessedStateUpdateId,
        trx
      )

    for (const record of recordsToRollback) {
      await this.preprocessedAssetHistoryRepository.deleteByHistoryId(
        record.historyId,
        trx
      )
      if (record.prevHistoryId !== undefined) {
        // Notice that when rolling back a closed vault (with balance 0 and
        // isCurrent=false) this call will "resurrect" the previous non-empty
        // record and mark it as current, which is exactly what we want.
        await this.preprocessedAssetHistoryRepository.updateAsCurrentByHistoryId(
          {
            isCurrent: true,
            historyId: record.prevHistoryId,
          },
          trx
        )
      }
    }
  }
}
