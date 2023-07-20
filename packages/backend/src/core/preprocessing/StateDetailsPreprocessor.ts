import { Logger } from '@l2beat/backend-tools'
import { Knex } from 'knex'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedStateDetailsRepository } from '../../peripherals/database/PreprocessedStateDetailsRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { sumNumericValuesByKey } from '../../utils/sumNumericValuesByKey'

export class StateDetailsPreprocessor {
  constructor(
    private readonly preprocessedStateDetailsRepository: PreprocessedStateDetailsRepository,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async preprocessNextStateUpdate(
    trx: Knex.Transaction,
    stateUpdate: StateUpdateRecord
  ) {
    const [assetUpdateCount, forcedTransactionCount] = await Promise.all([
      this.preprocessedAssetHistoryRepository.getCountByStateUpdateId(
        stateUpdate.id,
        trx
      ),
      this.userTransactionRepository.getCountOfIncludedByStateUpdateId(
        stateUpdate.id,
        trx
      ),
    ])

    await this.preprocessedStateDetailsRepository.add(
      {
        stateUpdateId: stateUpdate.id,
        stateTransitionHash: stateUpdate.stateTransitionHash,
        rootHash: stateUpdate.rootHash,
        blockNumber: stateUpdate.blockNumber,
        timestamp: stateUpdate.timestamp,
        assetUpdateCount,
        forcedTransactionCount,
      },
      trx
    )
  }

  async catchUpL2Transactions(
    trx: Knex.Transaction,
    preprocessToStateUpdateId: number
  ) {
    const recordsToUpdate =
      await this.preprocessedStateDetailsRepository.getAllWithoutL2TransactionStatisticsUpToStateUpdateId(
        preprocessToStateUpdateId,
        trx
      )

    for (const recordToUpdate of recordsToUpdate) {
      this.logger.info(
        `Catching up L2 transaction statistics for state update ${recordToUpdate.stateUpdateId}`
      )

      const statisticsForStateUpdate =
        await this.l2TransactionRepository.getStatisticsByStateUpdateId(
          recordToUpdate.stateUpdateId,
          trx
        )

      const previousStateUpdateDetails =
        await this.preprocessedStateDetailsRepository.findByStateUpdateId(
          recordToUpdate.stateUpdateId - 1,
          trx
        )

      if (
        recordToUpdate.stateUpdateId > 1 &&
        !previousStateUpdateDetails?.cumulativeL2TransactionsStatistics
      ) {
        throw new Error(
          'Statistics for previous state update where not preprocessed. This should never happen.'
        )
      }

      await this.preprocessedStateDetailsRepository.update(
        {
          id: recordToUpdate.id,
          l2TransactionsStatistics: statisticsForStateUpdate,
          cumulativeL2TransactionsStatistics:
            previousStateUpdateDetails?.cumulativeL2TransactionsStatistics
              ? sumNumericValuesByKey(
                  previousStateUpdateDetails.cumulativeL2TransactionsStatistics,
                  statisticsForStateUpdate
                )
              : statisticsForStateUpdate,
        },
        trx
      )
    }
  }

  async rollbackOneStateUpdate(
    trx: Knex.Transaction,
    lastProcessedStateUpdateId: number
  ) {
    await this.preprocessedStateDetailsRepository.deleteByStateUpdateId(
      lastProcessedStateUpdateId,
      trx
    )
  }
}
