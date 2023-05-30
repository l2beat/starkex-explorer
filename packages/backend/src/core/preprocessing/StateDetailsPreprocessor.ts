import { Knex } from 'knex'

import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { PreprocessedStateDetailsRepository } from '../../peripherals/database/PreprocessedStateDetailsRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { Logger } from '../../tools/Logger'

export class StateDetailsPreprocessor {
  constructor(
    protected readonly preprocessedStateDetailsRepository: PreprocessedStateDetailsRepository,
    protected readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    protected readonly userTransactionRepository: UserTransactionRepository,
    protected readonly logger: Logger
  ) {}

  async preprocessNextStateUpdate(
    trx: Knex.Transaction,
    stateUpdate: StateUpdateRecord
  ) {
    const [assetUpdateCount, forcedTransactionCount] = await Promise.all([
      this.preprocessedAssetHistoryRepository.countByStateUpdateId(
        stateUpdate.id,
        trx
      ),
      this.userTransactionRepository.countOfIncludedByStateUpdateId(
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
