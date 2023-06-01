import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { StateUpdateRecord } from '../../peripherals/database/StateUpdateRepository'
import { FeederGatewayClient } from '../../peripherals/starkware/FeederGatewayClient'
import { Logger } from '../../tools/Logger'

export class FeederGatewayCollector {
  constructor(
    private readonly feederGatewayClient: FeederGatewayClient,
    private readonly transactionRepository: L2TransactionRepository,
    private readonly logger: Logger
  ) {}

  async collect(
    stateUpdates: Pick<StateUpdateRecord, 'id' | 'batchId' | 'blockNumber'>[]
  ) {
    const latestSyncedTransactionStateUpdateId =
      (await this.transactionRepository.findLatestStateUpdateId()) ?? 0

    for (const stateUpdate of stateUpdates) {
      if (stateUpdate.id <= latestSyncedTransactionStateUpdateId) {
        continue
      }
      this.logger.info(`Collecting transactions from Feeder Gateway...`, {
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
