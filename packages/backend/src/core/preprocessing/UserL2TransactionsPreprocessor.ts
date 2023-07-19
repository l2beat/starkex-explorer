import { Logger } from '@l2beat/backend-tools'
import { Knex } from 'knex'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedUserL2TransactionsStatisticsRepository } from '../../peripherals/database/PreprocessedUserL2TransactionsStatisticsRepository'
import { sumNumericValuesByKey } from '../../utils/sumNumericValuesByKey'

export class UserL2TransactionsStatisticsPreprocessor {
  constructor(
    private readonly preprocessedUserL2TransactionsStatisticsRepository: PreprocessedUserL2TransactionsStatisticsRepository,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async catchUp(trx: Knex.Transaction, preprocessToStateUpdateId: number) {
    const lastPreprocessed =
      await this.preprocessedUserL2TransactionsStatisticsRepository.findLast()

    const start = lastPreprocessed ? lastPreprocessed.stateUpdateId + 1 : 1
    for (
      let stateUpdateId = start;
      stateUpdateId <= preprocessToStateUpdateId;
      stateUpdateId++
    ) {
      const starkKeys =
        await this.l2TransactionRepository.getStarkKeysByStateUpdateId(
          stateUpdateId,
          trx
        )

      for (const starkKey of starkKeys) {
        this.logger.info(
          `Preprocessing user (${starkKey.toString()}) l2 transactions for state update ${stateUpdateId}`
        )
        const l2TransactionsStatistics =
          await this.l2TransactionRepository.getStatisticsByStateUpdateIdAndStarkKey(
            stateUpdateId,
            starkKey,
            trx
          )

        const lastPreprocessedUserL2TransactionsStatistics =
          await this.preprocessedUserL2TransactionsStatisticsRepository.findCurrentByStarkKey(
            starkKey,
            trx
          )

        const cumulativeL2TransactionsStatistics =
          lastPreprocessedUserL2TransactionsStatistics
            ? sumNumericValuesByKey(
                lastPreprocessedUserL2TransactionsStatistics.cumulativeL2TransactionsStatistics,
                l2TransactionsStatistics
              )
            : l2TransactionsStatistics

        await this.preprocessedUserL2TransactionsStatisticsRepository.add(
          {
            stateUpdateId,
            starkKey,
            l2TransactionsStatistics,
            cumulativeL2TransactionsStatistics,
          },
          trx
        )
      }
    }
  }

  async rollbackOneStateUpdate(
    trx: Knex.Transaction,
    lastProcessedStateUpdateId: number
  ) {
    await this.preprocessedUserL2TransactionsStatisticsRepository.deleteByStateUpdateId(
      lastProcessedStateUpdateId,
      trx
    )
  }
}
