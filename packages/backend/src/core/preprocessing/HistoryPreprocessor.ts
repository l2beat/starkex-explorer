import { AssetHash, AssetId } from '@explorer/types'
import { Knex } from 'knex'

import {
  PreprocessedAssetHistoryRecord,
  PreprocessedAssetHistoryRepository,
} from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedStateUpdateRecord } from '../../peripherals/database/PreprocessedStateUpdateRepository'
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
    positionId: bigint,
    stateUpdate: StateUpdateRecord,
    tokenPrices: Record<string, bigint>
  ) {
    const recordsToClose =
      await this.preprocessedAssetHistoryRepository.getCurrentNonEmptyByPositionOrVaultId(
        positionId,
        trx
      )

    if (recordsToClose[0] !== undefined) {
      const starkKey = recordsToClose[0].starkKey
      const newRecords: Omit<PreprocessedAssetHistoryRecord, 'historyId'>[] =
        recordsToClose.map((record) => ({
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          timestamp: BigInt(Number(stateUpdate.timestamp)),
          starkKey: starkKey,
          positionOrVaultId: positionId,
          assetHashOrId: record.assetHashOrId,
          balance: 0n,
          prevBalance: record.balance,
          price: tokenPrices[record.assetHashOrId.toString()],
          prevPrice: record.price,
          prevHistoryId: record.historyId,
          isCurrent: true,
        }))
      await this.addNewRecordsAndMakeThemCurrent(trx, newRecords)
    }
  }

  async addNewRecordsAndMakeThemCurrent(
    trx: Knex.Transaction,
    newRecords: Omit<PreprocessedAssetHistoryRecord, 'historyId'>[]
  ) {
    // NOTICE:
    // Using loop because this call:
    // await this.preprocessedAssetHistoryRepository.addMany(newRecords, trx)
    // doesn't respect transaction(!!!!):

    for (const record of newRecords) {
      await this.preprocessedAssetHistoryRepository.unsetCurrentByStarkKeyAndAsset(
        record.starkKey,
        record.assetHashOrId,
        trx
      )
      await this.preprocessedAssetHistoryRepository.add(record, trx)
    }
  }

  async rollbackOneStateUpdate(
    trx: Knex.Transaction,
    lastProcessedStateUpdate: PreprocessedStateUpdateRecord
  ) {
    const recordsToRollback =
      await this.preprocessedAssetHistoryRepository.getPrevHistoryIdOfCurrentWithStateUpdateId(
        lastProcessedStateUpdate.stateUpdateId
      )

    for (const record of recordsToRollback) {
      await this.preprocessedAssetHistoryRepository.deleteByHistoryId(
        record.historyId,
        trx
      )
      if (record.prevHistoryId !== undefined) {
        await this.preprocessedAssetHistoryRepository.setCurrentByHistoryId(
          record.prevHistoryId,
          trx
        )
      }
    }
  }
}
