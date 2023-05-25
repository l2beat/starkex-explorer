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

  async sync(syncToStateUpdateId: number) {
    const latestSyncedTransactionStateUpdateId =
      (await this.transactionRepository.findLatestStateUpdateId()) ?? 0
    if (latestSyncedTransactionStateUpdateId >= syncToStateUpdateId) {
      return
    }

    for (
      let batchId = latestSyncedTransactionStateUpdateId + 1;
      batchId <= syncToStateUpdateId;
      batchId++
    ) {
      const stateUpdate = await this.stateUpdateRepository.findById(batchId)
      if (!stateUpdate) {
        throw new Error(`State update ${batchId} not found`)
      }

      const data = await this.feederGatewayClient.getPerpetualBatchInfo(batchId)
      this.logger.info(`Syncing transactions...`, {
        batchId,
        transactionCount: data.transactionsInfo.length,
      })
      for (const transactionInfo of data.transactionsInfo) {
        await this.transactionRepository.add({
          transactionId: transactionInfo.originalTransactionId,
          stateUpdateId: batchId,
          blockNumber: stateUpdate.blockNumber,
          data: transactionInfo.originalTransaction,
        })
      }
    }
  }

  async discardAfter(blockNumber: number) {
    await this.transactionRepository.deleteAfterBlock(blockNumber)
  }
}
