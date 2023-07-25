import { Logger } from '@l2beat/backend-tools'
import { Knex } from 'knex'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { LiveL2TransactionClient } from '../../peripherals/starkware/LiveL2TransactionClient'
import { PerpetualL2Transaction } from '../../peripherals/starkware/toPerpetualTransactions'
import { Clock } from './Clock'

export class LiveL2TransactionDownloader {
  private PAGE_SIZE = 100
  private lastSyncedThirdPartyId: number | undefined
  isRunning = false
  isEnabled = false

  constructor(
    private readonly l2TransactionClient: LiveL2TransactionClient,
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
      enabled: this.isEnabled,
    })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.clock.onEvery('5s', () => this.sync())
  }

  private async initialize() {
    const lastSyncedThirdPartyId = await this.keyValueStore.findByKey(
      'lastSyncedThirdPartyId'
    )
    if (!lastSyncedThirdPartyId) {
      return
    }

    this.isEnabled = true
    this.lastSyncedThirdPartyId = lastSyncedThirdPartyId
  }

  async enableSync() {
    if (this.isEnabled) {
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
    this.isEnabled = true
  }

  private async sync() {
    if (this.isRunning || !this.isEnabled) {
      return
    }

    this.isRunning = true

    const lastSyncedThirdPartyId = this.lastSyncedThirdPartyId
    if (!lastSyncedThirdPartyId) {
      this.isRunning = false
      return
    }

    await this.downloadAndAddTransactions(lastSyncedThirdPartyId + 1)
  }

  private async downloadAndAddTransactions(thirdPartyId: number) {
    this.logger.info(`Downloading live transactions from ${thirdPartyId}`)

    const transactions =
      await this.l2TransactionClient.getPerpetualLiveTransactions(
        thirdPartyId,
        this.PAGE_SIZE
      )

    if (!transactions) {
      this.isRunning = false
      return
    }

    const lastSyncedThirdPartyId = thirdPartyId + transactions.length
    await this.l2TransactionRepository.runInTransactionWithLockedTable(
      async (trx) => {
        await this.addTransactions(transactions, trx)

        await this.updateLastSyncedThirdPartyId(lastSyncedThirdPartyId, trx)
      }
    )

    if (transactions.length === this.PAGE_SIZE) {
      await this.downloadAndAddTransactions(lastSyncedThirdPartyId)
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
