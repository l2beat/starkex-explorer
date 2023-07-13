import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { L2TransactionClient } from '../../peripherals/starkware/L2TransactionClient'
import { Logger } from '../../tools/Logger'
import { Clock } from './Clock'

export class L2TransactionDownloader {
  private clock = new Clock()
  private PAGE_SIZE = 100
  private isRunning = false
  private lastSyncedThirdPartyId: number | undefined

  constructor(
    private readonly l2TransactionClient: L2TransactionClient,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly keyValueStore: KeyValueStore,
    private readonly logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  start() {
    this.clock.onEvery('15s', () => this.downloadNewTransactions())
  }

  async downloadNewTransactions() {
    if (this.isRunning) {
      return
    }
    this.isRunning = true

    this.logger.info('Starting L2 transaction downloader')
    const lastIncluded = await this.l2TransactionRepository.findLatestIncluded()
    if (!lastIncluded) {
      this.isRunning = false
      return
    }

    this.lastSyncedThirdPartyId = Number(
      await this.keyValueStore.findByKey('lastSyncedThirdPartyId')
    )

    let thirdPartyIdToSync = this.lastSyncedThirdPartyId
      ? this.lastSyncedThirdPartyId
      : await this.l2TransactionClient.getThirdPartyIdByTransactionId(
          lastIncluded.transactionId
        )

    if (!thirdPartyIdToSync) {
      this.isRunning = false
      return
    }

    while (true) {
      this.logger.info(thirdPartyIdToSync.toString())
      const transactions = await this.addTransactions(thirdPartyIdToSync)

      if (!transactions) {
        break
      }
      this.lastSyncedThirdPartyId =
        transactions[transactions.length - 1]?.thirdPartyId

      thirdPartyIdToSync += this.PAGE_SIZE
    }

    if (this.lastSyncedThirdPartyId) {
      await this.keyValueStore.addOrUpdate({
        key: 'lastSyncedThirdPartyId',
        value: this.lastSyncedThirdPartyId.toString(),
      })
    }
    this.isRunning = false
  }

  private async addTransactions(thirdPartyId: number) {
    this.logger.info(`Downloading transactions from ${thirdPartyId}`)
    const transactions =
      await this.l2TransactionClient.getPerpetualTransactions(
        thirdPartyId,
        this.PAGE_SIZE
      )

    if (!transactions) {
      this.logger.info('No transactions found')
      return
    }

    for (const transaction of transactions) {
      await this.l2TransactionRepository.add({
        transactionId: transaction.transactionId,
        data: transaction.transaction,
      })
    }
    return transactions
  }
}
