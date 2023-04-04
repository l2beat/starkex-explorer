import { Knex } from 'knex'

import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedUserStatisticsRepository } from '../../peripherals/database/PreprocessedUserStatisticsRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { Logger } from '../../tools/Logger'

export class UserStatisticsPreprocessor {
  constructor(
    private preprocessedUserStatisticsRepository: PreprocessedUserStatisticsRepository,
    private preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    protected logger: Logger
  ) {}

  // TODO: add catchUp() method to reprocess all state updates on first run

  async preprocessNextStateUpdate(
    trx: Knex.Transaction,
    stateUpdate: StateUpdateRecord
  ) {
    const uniqueStarkKeys =
      await this.preprocessedAssetHistoryRepository.getUniqueStarkKeysByStateUpdateId(
        stateUpdate.id,
        trx
      )

    const starkKeyCounts =
      await this.preprocessedAssetHistoryRepository.getCountByStarkKeysAndStateUpdateId(
        uniqueStarkKeys,
        stateUpdate.id,
        trx
      )
    for (const starkKeyCount of starkKeyCounts) {
      const current =
        await this.preprocessedUserStatisticsRepository.findCurrentByStarkKey(
          starkKeyCount.starkKey,
          trx
        )
      const updatedBalanceChangeCount =
        current?.balanceChangeCount ?? 0n + starkKeyCount.count

      const assetCount =
        await this.preprocessedAssetHistoryRepository.getCountOfCurrentByStarkKey(
          starkKeyCount.starkKey,
          trx
        )

      await this.preprocessedUserStatisticsRepository.add(
        {
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          timestamp: stateUpdate.timestamp,
          starkKey: starkKeyCount.starkKey,
          balanceChangeCount: updatedBalanceChangeCount,
          assetCount: BigInt(assetCount),
          prevHistoryId: current?.id,
        },
        trx
      )
    }
  }

  async rollbackOneStateUpdate(
    trx: Knex.Transaction,
    lastProcessedStateUpdateId: number
  ) {
    await this.preprocessedUserStatisticsRepository.deleteByStateUpdateId(
      lastProcessedStateUpdateId,
      trx
    )
  }
}
