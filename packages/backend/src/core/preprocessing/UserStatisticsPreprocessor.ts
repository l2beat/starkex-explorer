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
    const uniqueStarkKeys =
      // We must get by state update id and not "current" because we use this function in catchUp()
      await this.preprocessedAssetHistoryRepository.getUniqueStarkKeysByStateUpdateId(
        stateUpdate.id,
        trx
      )

    const starkKeyCounts =
      // We must get by state update id and not "current" because we use this function in catchUp()
      await this.preprocessedAssetHistoryRepository.getCountByStarkKeysAndStateUpdateId(
        uniqueStarkKeys,
        stateUpdate.id,
        trx
      )
    for (const starkKeyCount of starkKeyCounts) {
      const current =
        // it's ok to get current because even during catchUp() current is the same as the state update we're processing
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
