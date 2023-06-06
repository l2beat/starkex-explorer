import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { FeederGatewayClient } from '../../peripherals/starkware/FeederGatewayClient'
import { Logger } from '../../tools/Logger'

export class FeederGatewayCollector {
  constructor(
    private readonly feederGatewayClient: FeederGatewayClient,
    private readonly transactionRepository: L2TransactionRepository,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly logger: Logger
  ) {}

  async collect(syncToStateUpdateId: number) {
    const latestSyncedTransactionStateUpdateId =
      await this.transactionRepository.findLatestStateUpdateId()

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

      if (!stateUpdate) {
        throw new Error(
          `State update with id ${stateUpdateId} not found in database`
        )
      }

      this.logger.info(`Collecting transactions from Feeder Gateway`, {
        stateUpdateId: stateUpdate.id,
      })

      const data = await this.feederGatewayClient.getPerpetualBatchInfo(
        stateUpdate.batchId
      )

      // We stop collecting transactions if there is no batch data.
      if (!data) {
        return
      }

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
  }
}
