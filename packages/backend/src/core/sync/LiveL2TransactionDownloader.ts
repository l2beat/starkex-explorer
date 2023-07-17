import { Knex } from 'knex'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { L2TransactionClient } from '../../peripherals/starkware/L2TransactionClient'
import { PerpetualL2Transaction } from '../../peripherals/starkware/toPerpetualTransactions'
import { Logger } from '../../tools/Logger'
import { Clock } from './Clock'

export class LiveL2TransactionDownloader {
  private PAGE_SIZE = 100
  private isRunning = false
  private lastSyncedThirdPartyId: number | undefined
  private enabled = false

  constructor(
    private readonly l2TransactionClient: L2TransactionClient,
    private readonly l2TransactionRepository: L2TransactionRepository,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly keyValueStore: KeyValueStore,
    private readonly clock: Clock,
    private readonly logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async start() {
    await this.initialize()
    this.logger.info('Starting L2 transaction downloader', {
      enabled: this.enabled,
    })
    this.clock.onEvery('5s', () => this.sync())
  }

  private async initialize() {
    const lastSyncedThirdPartyId = await this.keyValueStore.findByKey(
      'lastSyncedThirdPartyId'
    )
    if (!lastSyncedThirdPartyId) {
      return
    }

    this.enabled = true
    this.lastSyncedThirdPartyId = lastSyncedThirdPartyId
  }

  async enableSync() {
    if (this.enabled) {
      return
    }

    const lastStateUpdate = await this.stateUpdateRepository.findLast()
    if (!lastStateUpdate) {
      return
    }
    const lastIncluded = await this.l2TransactionRepository.findLatestIncluded()
    if (!lastIncluded) {
      return
    }

    if (lastStateUpdate.id !== lastIncluded.stateUpdateId) {
      return
    }

    const lastSyncedThirdPartyId =
      await this.l2TransactionClient.getThirdPartyIdByTransactionId(
        lastIncluded.transactionId
      )
    if (!lastSyncedThirdPartyId) {
      return
    }
    this.logger.info('Enabling L2 transaction downloader')
    await this.updateLastSyncedThirdPartyId(lastSyncedThirdPartyId)
    this.enabled = true
  }

  private async sync() {
    if (this.isRunning) {
      return
    }
    this.isRunning = true

    const lastSyncedThirdPartyId = this.lastSyncedThirdPartyId
    if (!lastSyncedThirdPartyId) {
      this.isRunning = false
      return
    }

    await this.l2TransactionRepository.runInTransactionWithLockedTable(
      async (trx) => {
        await this.downloadAndAddTransactions(lastSyncedThirdPartyId + 1, trx)
      }
    )
  }

  private async downloadAndAddTransactions(
    thirdPartyId: number,
    trx: Knex.Transaction
  ) {
    this.logger.info(`Downloading live transactions from ${thirdPartyId}`)

    const transactions =
      await this.l2TransactionClient.getPerpetualTransactions(
        thirdPartyId,
        this.PAGE_SIZE
      )

    if (!transactions) {
      this.logger.info('No transactions found')
      this.isRunning = false
      return
    }

    await this.addTransactions(transactions, trx)

    const lastSyncedThirdPartyId = thirdPartyId + this.PAGE_SIZE
    await this.updateLastSyncedThirdPartyId(lastSyncedThirdPartyId, trx)

    if (transactions.length === this.PAGE_SIZE) {
      await this.downloadAndAddTransactions(lastSyncedThirdPartyId, trx)
    } else {
      this.isRunning = false
    }
  }

  private async addTransactions(
    transactions: PerpetualL2Transaction[],
    trx: Knex.Transaction
  ) {
    for (const transaction of transactions) {
      await this.l2TransactionRepository.add(
        {
          transactionId: transaction.transactionId,
          data: transaction.transaction,
        },
        trx
      )
    }
  }

  private async updateLastSyncedThirdPartyId(
    lastSyncedThirdPartyId: number,
    trx?: Knex.Transaction
  ) {
    await this.keyValueStore.addOrUpdate(
      {
        key: 'lastSyncedThirdPartyId',
        value: lastSyncedThirdPartyId,
      },
      trx
    )
    this.lastSyncedThirdPartyId = lastSyncedThirdPartyId
  }
}
