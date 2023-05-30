import { Knex } from 'knex'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedStateUpdateRepository } from '../../peripherals/database/PreprocessedStateUpdateRepository'
import { PreprocessedUserStatisticsRepository } from '../../peripherals/database/PreprocessedUserStatisticsRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { Logger } from '../../tools/Logger'

export class UserStatisticsPreprocessor {
  constructor(
    private preprocessedUserStatisticsRepository: PreprocessedUserStatisticsRepository,
    private preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private preprocessedStateUpdateRepository: PreprocessedStateUpdateRepository,
    private stateUpdateRepository: StateUpdateRepository,
    private readonly kvStore: KeyValueStore,
    protected logger: Logger
  ) {}

  async catchUp(trx: Knex.Transaction) {
    const kvKey = 'userStatisticsPreprocessorCaughtUp'
    const isCaughtUp = await this.kvStore.findByKey(kvKey, trx)
    if (isCaughtUp === 'true') {
      return
    }
    this.logger.info('Catching up UserStatisticsPreprocessor...')

    await this.preprocessedUserStatisticsRepository.deleteAll(trx)
    const lastProcessedStateUpdate =
      await this.preprocessedStateUpdateRepository.findLast(trx)

    for (
      let stateUpdateId = 1;
      stateUpdateId <= (lastProcessedStateUpdate?.stateUpdateId ?? 0);
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
        this.preprocessedAssetHistoryRepository.countByStateUpdateIdGroupedByStarkKey(
          stateUpdate.id,
          trx
        ),
        this.preprocessedAssetHistoryRepository.countOfNewAssetsByStateUpdateIdGroupedByStarkKey(
          stateUpdate.id,
          trx
        ),
        this.preprocessedAssetHistoryRepository.countOfRemovedAssetsByStateUpdateIdGroupedByStarkKey(
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
