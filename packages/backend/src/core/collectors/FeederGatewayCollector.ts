import { Logger } from '@l2beat/backend-tools'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { FeederGatewayClient } from '../../peripherals/starkware/FeederGatewayClient'

export class FeederGatewayCollector {
  constructor(
    private readonly feederGatewayClient: FeederGatewayClient,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly logger: Logger
  ) {}

  async collect() {
    const latestStateUpdate = await this.stateUpdateRepository.findLast()
    if (!latestStateUpdate) return

    const latestSyncedTransactionStateUpdateId =
      await this.l2TransactionRepository.findLatestStateUpdateId()

    for (
      let stateUpdateId = latestSyncedTransactionStateUpdateId
        ? latestSyncedTransactionStateUpdateId + 1
        : 1;
      stateUpdateId <= latestStateUpdate.id;
      stateUpdateId++
    ) {
      const stateUpdate = await this.stateUpdateRepository.findById(
        stateUpdateId
      )

      // We throw an error if the state update is not found.
      // It's a critical error and we should stop the sync process, becasue
      // latestStateUpdate was found, but the state update before it was not.
      if (!stateUpdate) {
        throw new Error(`State update ${stateUpdateId} not found`)
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

      await this.l2TransactionRepository.runInTransactionWithLockedTable(
        async (trx) => {
          const transactionIds = data.transactionsInfo.map(
            (tx) => tx.originalTransactionId
          )
          await this.l2TransactionRepository.deleteByTransactionIds(
            transactionIds,
            trx
          )
          for (const transactionInfo of data.transactionsInfo) {
            await this.l2TransactionRepository.add(
              {
                stateUpdateId: stateUpdate.id,
                blockNumber: stateUpdate.blockNumber,
                transactionId: transactionInfo.originalTransactionId,
                data: transactionInfo.originalTransaction,
              },
              trx
            )
            if (!transactionInfo.alternativeTransactions) {
              continue
            }
            for (const alternativeTransaction of transactionInfo.alternativeTransactions) {
              await this.l2TransactionRepository.add(
                {
                  stateUpdateId: stateUpdate.id,
                  blockNumber: stateUpdate.blockNumber,
                  transactionId: transactionInfo.originalTransactionId,
                  data: alternativeTransaction,
                },
                trx
              )
            }
          }
        }
      )
    }
  }

  async discardAfter(blockNumber: number) {
    await this.l2TransactionRepository.deleteAfterBlock(blockNumber)
  }
}
