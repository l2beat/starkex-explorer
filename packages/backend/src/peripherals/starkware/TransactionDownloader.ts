import { Logger } from '../../tools/Logger'
import { TransactionRepository } from '../database/TransactionRepository'
import { FeederGatewayClient } from './FeederGatewayClient'

export class TransactionDownloader {
  constructor(
    private readonly feederGatewayClient: FeederGatewayClient,
    private readonly transactionRepository: TransactionRepository,
    private readonly logger: Logger
  ) {}

  async sync(
    stateUpdates: { batchId: number; id: number; blockNumber: number }[]
  ) {
    const latestSyncedTransactionStateUpdateId =
      (await this.transactionRepository.findLatestStateUpdateId()) ?? 0

    for (const stateUpdate of stateUpdates) {
      if (stateUpdate.id <= latestSyncedTransactionStateUpdateId) {
        continue
      }
      this.logger.info(`Syncing transactions...`, {
        stateUpdateId: stateUpdate.id,
      })

      const data = await this.feederGatewayClient.getPerpetualBatchInfo(
        stateUpdate.batchId
      )

      for (const transactionInfo of data.transactionsInfo) {
        await this.transactionRepository.add({
          stateUpdateId: stateUpdate.id,
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
