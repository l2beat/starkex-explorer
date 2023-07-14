import { Knex } from 'knex'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedUserStatisticsRepository } from '../../peripherals/database/PreprocessedUserStatisticsRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { Logger } from '../../tools/Logger'
import { sumNumericValuesByKey } from '../../utils/sumNumericValuesByKey'

export class UserStatisticsPreprocessor {
  constructor(
    private readonly preprocessedUserStatisticsRepository: PreprocessedUserStatisticsRepository,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly kvStore: KeyValueStore,
    private readonly logger: Logger
  ) {}

  async catchUp(trx: Knex.Transaction, lastProcessedStateUpdateId: number) {
    const kvKey = 'userStatisticsPreprocessorCaughtUp'
    const isCaughtUp = await this.kvStore.findByKey(kvKey, trx)
    if (isCaughtUp === 'true') {
      return
    }
    this.logger.info('Catching up UserStatisticsPreprocessor...')

    await this.preprocessedUserStatisticsRepository.deleteAll(trx)

    for (
      let stateUpdateId = 1;
      stateUpdateId <= lastProcessedStateUpdateId;
      stateUpdateId++
    ) {
      const stateUpdate = await this.stateUpdateRepository.findById(
        stateUpdateId,
        trx
      )
      if (stateUpdate === undefined) {
        throw new Error(
          `UserStatisticsPreprocessor catchUp was requested, but next state update (${stateUpdateId}) is missing`
        )
      }
      this.logger.info(
        `Preprocessing user statistics for state update ${stateUpdate.id} (catchUp)`
      )
      await this.preprocessNextStateUpdate(trx, stateUpdate)
    }

    await this.kvStore.addOrUpdate(
      {
        key: kvKey,
        value: 'true',
      },
      trx
    )
  }

  async preprocessNextStateUpdate(
    trx: Knex.Transaction,
    stateUpdate: StateUpdateRecord
  ) {
    // We must get by state update id and not "current" because we use this function in catchUp()
    const [starkKeyCounts, newAssetCounts, removedAssetCounts] =
      await Promise.all([
        this.preprocessedAssetHistoryRepository.getCountByStateUpdateIdGroupedByStarkKey(
          stateUpdate.id,
          trx
        ),
        this.preprocessedAssetHistoryRepository.getCountOfNewAssetsByStateUpdateIdGroupedByStarkKey(
          stateUpdate.id,
          trx
        ),
        this.preprocessedAssetHistoryRepository.getCountOfRemovedAssetsByStateUpdateIdGroupedByStarkKey(
          stateUpdate.id,
          trx
        ),
      ])

    for (const starkKeyCount of starkKeyCounts) {
      const starkKey = starkKeyCount.starkKey
      // it's ok to get "current" on preprocessedUserStatisticsRepository
      // because that's what we're building here, so we're always at the tip.
      const currentStatisticsRecord =
        await this.preprocessedUserStatisticsRepository.findCurrentByStarkKey(
          starkKey,
          trx
        )

      const balanceChangeCount =
        (currentStatisticsRecord?.balanceChangeCount ?? 0) + starkKeyCount.count
      const newAssets =
        newAssetCounts.find((x) => x.starkKey === starkKey)?.count ?? 0
      const removedAssets =
        removedAssetCounts.find((x) => x.starkKey === starkKey)?.count ?? 0

      const assetCount =
        (currentStatisticsRecord?.assetCount ?? 0) + newAssets - removedAssets

      await this.preprocessedUserStatisticsRepository.add(
        {
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          timestamp: stateUpdate.timestamp,
          starkKey: starkKeyCount.starkKey,
          balanceChangeCount,
          assetCount,
          prevHistoryId: currentStatisticsRecord?.id,
        },
        trx
      )
    }
  }

  async catchUpL2Transactions(
    trx: Knex.Transaction,
    preprocessToStateUpdateId: number
  ) {
    const recordsToUpdate =
      await this.preprocessedUserStatisticsRepository.getAllWithoutL2TransactionStatisticsUpToStateUpdateId(
        preprocessToStateUpdateId,
        trx
      )

    for (const recordToUpdate of recordsToUpdate) {
      this.logger.info(
        `Preprocessing l2 transactions user (${recordToUpdate.starkKey.toString()}) statistics for state update ${
          recordToUpdate.stateUpdateId
        }`
      )
      const l2TransactionsStatistics =
        await this.l2TransactionRepository.getStatisticsByStateUpdateIdAndStarkKey(
          recordToUpdate.stateUpdateId,
          recordToUpdate.starkKey,
          trx
        )

      const lastPreprocessedUserStatistics =
        await this.preprocessedUserStatisticsRepository.findLastWithL2TransactionsStatisticsByStarkKey(
          recordToUpdate.starkKey,
          trx
        )

      await this.preprocessedUserStatisticsRepository.update(
        {
          id: recordToUpdate.id,
          l2TransactionsStatistics:
            lastPreprocessedUserStatistics?.l2TransactionsStatistics
              ? sumNumericValuesByKey(
                  lastPreprocessedUserStatistics.l2TransactionsStatistics,
                  l2TransactionsStatistics
                )
              : l2TransactionsStatistics,
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
