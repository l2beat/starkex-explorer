import { Knex } from 'knex'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedUserL2TransactionsRepository } from '../../peripherals/database/PreprocessedUserL2TransactionsRepository'
import { Logger } from '../../tools/Logger'
import { sumNumericValuesByKey } from '../../utils/sumNumericValuesByKey'

export class UserL2TransactionsPreprocessor {
  constructor(
    private readonly preprocessedUserL2TransactionsRepository: PreprocessedUserL2TransactionsRepository,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly logger: Logger
  ) {}

  async catchUp(trx: Knex.Transaction, preprocessToStateUpdateId: number) {
    const lastPreprocessed =
      await this.preprocessedUserL2TransactionsRepository.findLast()

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

        const lastPreprocessedUserStatistics =
          await this.preprocessedUserL2TransactionsRepository.findCurrentByStarkKey(
            starkKey,
            trx
          )

        const cumulativeL2TransactionsStatistics =
          lastPreprocessedUserStatistics
            ? sumNumericValuesByKey(
                lastPreprocessedUserStatistics.cumulativeL2TransactionsStatistics,
                l2TransactionsStatistics
              )
            : l2TransactionsStatistics

        await this.preprocessedUserL2TransactionsRepository.add(
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
    await this.preprocessedUserL2TransactionsRepository.deleteByStateUpdateId(
      lastProcessedStateUpdateId,
      trx
    )
  }
}
