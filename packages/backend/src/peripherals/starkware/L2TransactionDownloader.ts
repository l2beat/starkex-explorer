import { Logger } from '../../tools/Logger'
import { L2TransactionRepository } from '../database/L2TransactionRepository'
import { StateUpdateRecord } from '../database/StateUpdateRepository'
import { FeederGatewayClient } from './FeederGatewayClient'

export class L2TransactionDownloader {
  constructor(
    private readonly feederGatewayClient: FeederGatewayClient,
    private readonly transactionRepository: L2TransactionRepository,
    private readonly logger: Logger
  ) {}

  async sync(
    stateUpdates: Pick<StateUpdateRecord, 'id' | 'batchId' | 'blockNumber'>[]
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
        if (!transactionInfo.alternativeTransactions) {
          continue
        }
        for (const alternativeTransaction of transactionInfo.alternativeTransactions) {
          await this.transactionRepository.add({
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionInfo.originalTransactionId,
            data: alternativeTransaction,
          })
        }
      }
    }
  }

  async discardAfter(blockNumber: number) {
    await this.transactionRepository.deleteAfterBlock(blockNumber)
    //TODO: delete all that have blockNumber undefined (from live API)
  }
}
