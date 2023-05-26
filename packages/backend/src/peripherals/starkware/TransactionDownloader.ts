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

    for (
      let stateUpdateId = latestSyncedTransactionStateUpdateId + 1;
      stateUpdateId <= syncToStateUpdateId;
      stateUpdateId++
    ) {
      this.logger.info(`Syncing transactions...`, {
        stateUpdateId,
      })
      const stateUpdate = await this.stateUpdateRepository.findById(
        stateUpdateId
      )
      if (!stateUpdate) {
        throw new Error(`State update ${stateUpdateId} not found`)
      }

      const data = await this.feederGatewayClient.getPerpetualBatchInfo(
        stateUpdate.batchId
      )

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
