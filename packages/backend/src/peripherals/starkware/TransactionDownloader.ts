import { Logger } from '../../tools/Logger'
import { StateUpdateRepository } from '../database/StateUpdateRepository'
import { TransactionRepository } from '../database/TransactionRepository'
import { FeederGatewayClient } from './FeederGatewayClient'

export class TransactionDownloader {
  constructor(
    private readonly feederGatewayClient: FeederGatewayClient,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly logger: Logger
  ) {}

  async sync(syncToBatchId: number) {
    const latestSyncedTransactionStateUpdateId =
      await this.transactionRepository.findLatestStateUpdateId()
    const startSyncFromBatchId = latestSyncedTransactionStateUpdateId
      ? latestSyncedTransactionStateUpdateId // - 1 (to get batchId) + 1 (to get where to start from)
      : 0

    for (
      let batchId = startSyncFromBatchId;
      batchId <= syncToBatchId;
      batchId++
    ) {
      const stateUpdateId = batchId + 1
      this.logger.info(`Syncing transactions...`, {
        stateUpdateId,
      })

      const data = await this.feederGatewayClient.getPerpetualBatchInfo(batchId)

      const stateUpdate = await this.stateUpdateRepository.findById(
        stateUpdateId
      )
      if (!stateUpdate) {
        throw new Error(`State update ${stateUpdateId} not found`)
      }

      for (const transactionInfo of data.transactionsInfo) {
        await this.transactionRepository.add({
          stateUpdateId,
          blockNumber: stateUpdate.blockNumber,
          transactionId: transactionInfo.originalTransactionId,
          data: transactionInfo.originalTransaction,
        })
      }
    }
  }

  async discardAfter(blockNumber: number) {
    await this.transactionRepository.deleteAfterBlock(blockNumber)
  }
}
