import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { FeederGatewayClient } from '../../peripherals/starkware/FeederGatewayClient'
import { Logger } from '../../tools/Logger'

export class FeederGatewayCollector {
  constructor(
    private readonly feederGatewayClient: FeederGatewayClient,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly logger: Logger
  ) {}

  async collect(syncToStateUpdateId: number) {
    const latestSyncedTransactionStateUpdateId =
      await this.l2TransactionRepository.findLatestStateUpdateId()

    for (
      let stateUpdateId = latestSyncedTransactionStateUpdateId
        ? latestSyncedTransactionStateUpdateId + 1
        : 1;
      stateUpdateId <= syncToStateUpdateId;
      stateUpdateId++
    ) {
      const stateUpdate = await this.stateUpdateRepository.findById(
        stateUpdateId
      )

      // We stop collecting transactions if there is no state update in db.
      // It will not stop the sync process, but it will stop the transaction collection.
      // We will try to collect unsynced transactions on the next state update sync.
      if (!stateUpdate) {
        return
      }

      this.logger.info(`Collecting transactions from Feeder Gateway`, {
        stateUpdateId: stateUpdate.id,
      })

      const data = await this.feederGatewayClient.getPerpetualBatchInfo(
        stateUpdate.batchId
      )

      // We stop collecting transactions if there is no batch data.
      // It will not stop the sync process, but it will stop the transaction collection.
      // We will try to collect unsynced transactions on the next state update sync.
      if (!data) {
        return
      }

      for (const transactionInfo of data.transactionsInfo) {
        await this.l2TransactionRepository.add({
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          transactionId: transactionInfo.originalTransactionId,
          data: transactionInfo.originalTransaction,
        })
        if (!transactionInfo.alternativeTransactions) {
          continue
        }
        for (const alternativeTransaction of transactionInfo.alternativeTransactions) {
          await this.l2TransactionRepository.add({
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
    await this.l2TransactionRepository.deleteAfterBlock(blockNumber)
  }
}
