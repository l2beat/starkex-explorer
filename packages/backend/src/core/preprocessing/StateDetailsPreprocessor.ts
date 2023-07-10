import { Knex } from 'knex'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { sumPreprocessedL2TransactionsStatistics } from '../../peripherals/database/PreprocessedL2TransactionsStatistics'
import { PreprocessedStateDetailsRepository } from '../../peripherals/database/PreprocessedStateDetailsRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'

export class StateDetailsPreprocessor {
  constructor(
    private readonly preprocessedStateDetailsRepository: PreprocessedStateDetailsRepository,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private readonly userTransactionRepository: UserTransactionRepository,
    private readonly l2TransactionRepository: L2TransactionRepository
  ) {}

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

  async catchUpL2Transactions(trx: Knex.Transaction, stateUpdateId: number) {
    const lastWithL2TransactionCount =
      await this.preprocessedStateDetailsRepository.findLastWithL2TransactionsStatistics(
        trx
      )

    const lastL2TransactionStateUpdateId =
      await this.l2TransactionRepository.findLatestStateUpdateId(trx)

    const preprocessTo = lastL2TransactionStateUpdateId
      ? Math.min(lastL2TransactionStateUpdateId, stateUpdateId)
      : stateUpdateId

    for (
      let id = lastWithL2TransactionCount?.stateUpdateId
        ? lastWithL2TransactionCount.stateUpdateId + 1
        : 1;
      id <= preprocessTo;
      id++
    ) {
      const preprocessedRecord =
        await this.preprocessedStateDetailsRepository.findByStateUpdateId(
          id,
          trx
        )

      if (!preprocessedRecord)
        throw new Error(
          `PreprocessedStateDetails not found for stateUpdateId: ${id}`
        )

      const previousPreprocessedRecord =
        await this.preprocessedStateDetailsRepository.findByStateUpdateId(
          id - 1,
          trx
        )

      // Sanity check: previousPreprocessedRecord should exist if it does not exist then something is wrong
      if (id > 1 && !previousPreprocessedRecord) {
        throw new Error(
          `PreprocessedStateDetails not found for stateUpdateId: ${id - 1}`
        )
      }

      const statistics =
        await this.l2TransactionRepository.getStatisticsByStateUpdateId(id, trx)

      await this.preprocessedStateDetailsRepository.update(
        {
          id: preprocessedRecord.id,
          l2TransactionsStatistics: statistics,
          cumulativeL2TransactionsStatistics:
            previousPreprocessedRecord?.cumulativeL2TransactionsStatistics
              ? sumPreprocessedL2TransactionsStatistics(
                  previousPreprocessedRecord.cumulativeL2TransactionsStatistics,
                  statistics
                )
              : statistics,
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
