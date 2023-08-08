import { Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { Knex } from 'knex'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { FeederGatewayClient } from '../../peripherals/starkware/FeederGatewayClient'

export class FeederGatewayCollector {
  constructor(
    private readonly feederGatewayClient: FeederGatewayClient,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly logger: Logger,
    private readonly l2TransactionsEnabled: boolean
  ) {}

  async collect() {
    if (!this.l2TransactionsEnabled) return

    const latestStateUpdate = await this.stateUpdateRepository.findLast()
    if (!latestStateUpdate) return

    const latestSyncedTransactionStateUpdateId =
      await this.l2TransactionRepository.findLatestStateUpdateId()

    await this.l2TransactionRepository.runInTransactionWithLockedTable(
      async (trx) => {
        for (
          let stateUpdateId = latestSyncedTransactionStateUpdateId
            ? latestSyncedTransactionStateUpdateId + 1
            : 1;
          stateUpdateId <= latestStateUpdate.id;
          stateUpdateId++
        ) {
          await this.collectForStateUpdate(stateUpdateId, trx)
        }
      }
    )
  }

  async collectForStateUpdate(stateUpdateId: number, trx: Knex.Transaction) {
    const stateUpdate = await this.stateUpdateRepository.findById(
      stateUpdateId,
      trx
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

    const transactionIds = data.transactionsInfo.map(
      (tx) => tx.originalTransactionId
    )
    const timestampsGroupedByTransactionId =
      await this.l2TransactionRepository.getTimestampsGroupedByTransactionId(
        transactionIds,
        trx
      )

    await this.l2TransactionRepository.deleteByTransactionIds(
      transactionIds,
      trx
    )

    for (const transactionInfo of data.transactionsInfo) {
      const isReplaced =
        !!transactionInfo.alternativeTransactions &&
        transactionInfo.alternativeTransactions.length > 0

      const timestamp = this.getL2TransactionTimestamp(
        timestampsGroupedByTransactionId,
        transactionInfo.originalTransactionId,
        data.timeCreated
      )

      await this.l2TransactionRepository.addFeederGatewayTransaction(
        {
          stateUpdateId: stateUpdate.id,
          blockNumber: stateUpdate.blockNumber,
          transactionId: transactionInfo.originalTransactionId,
          data: transactionInfo.originalTransaction,
          timestamp,
          state: isReplaced ? 'replaced' : undefined,
        },
        trx
      )
      if (!transactionInfo.alternativeTransactions) {
        continue
      }

      for (const [
        altIndex,
        alternativeTransaction,
      ] of transactionInfo.alternativeTransactions.entries()) {
        const timestamp = this.getL2TransactionTimestamp(
          timestampsGroupedByTransactionId,
          transactionInfo.originalTransactionId,
          data.timeCreated,
          altIndex
        )

        await this.l2TransactionRepository.addFeederGatewayTransaction(
          {
            stateUpdateId: stateUpdate.id,
            blockNumber: stateUpdate.blockNumber,
            transactionId: transactionInfo.originalTransactionId,
            data: alternativeTransaction,
            timestamp,
            state: 'alternative',
          },
          trx
        )
      }
    }
  }

  getL2TransactionTimestamp(
    timestampsGroupedByTransactionId: Record<number, Timestamp[]>,
    transactionId: number,
    fallbackTimestamp: Timestamp | undefined,
    altIndex?: number
  ) {
    const timestamps = timestampsGroupedByTransactionId[transactionId]
    if (!timestamps) {
      return fallbackTimestamp
    }
    if (altIndex !== undefined) {
      return timestamps.at(altIndex + 1) ?? timestamps.at(-1)
    }

    return timestamps.at(0)
  }

  async discardAfter(blockNumber: number) {
    await this.l2TransactionRepository.deleteAfterBlock(blockNumber)
  }
}
