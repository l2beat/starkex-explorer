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

    try {
      await this.downloadAndAddTransactions(lastSyncedThirdPartyId + 1)
    } catch (error) {
      // Ignoring the error - we don't want to kill the server
      this.logger.error(error)
    }
    this.isRunning = false
  }

  private async downloadAndAddTransactions(thirdPartyId: number) {
    let thirdPartyIdToSync: number = thirdPartyId

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      this.logger.info(
        `Downloading live transactions from thirdPartyId ${thirdPartyIdToSync}`
      )
      const transactions =
        await this.l2TransactionClient.getPerpetualLiveTransactions(
          thirdPartyIdToSync,
          this.PAGE_SIZE
        )

      if (!transactions) {
        break
      }

      // Log some information of received data
      const firstTransaction = transactions[0]
      if (firstTransaction) {
        this.logger.info(
          firstTransaction.parsedSuccessfully
            ? `Received ${transactions.length} L2 txs. First id is ${firstTransaction.transactionId}`
            : `Received ${transactions.length} L2 txs. First one is a parse error`
        )
      } else {
        this.logger.info('Received no Live L2 txs')
      }

      thirdPartyIdToSync = thirdPartyIdToSync + transactions.length
      const lastSyncedThirdPartyId = thirdPartyIdToSync - 1
      if (
        transactions[transactions.length - 1]?.thirdPartyId !==
        lastSyncedThirdPartyId
      ) {
        throw new Error('ThirdPartyId should come in sequential order')
      }

      await this.l2TransactionRepository.runInTransactionWithLockedTable(
        async (trx) => {
          await this.addTransactions(transactions, trx)

          await this.updateLastSyncedThirdPartyId(lastSyncedThirdPartyId, trx)
        }
      )

      if (transactions.length < this.PAGE_SIZE) {
        break
      }
    }
  }

  private async addTransactions(
    transactions: PerpetualL2Transaction[],
    trx: Knex.Transaction
  ) {
    for (const transaction of transactions) {
      if (transaction.parsedSuccessfully) {
        const record = {
          transactionId: transaction.transactionId,
          data: transaction.transaction,
          timestamp: transaction.timestamp,
        }

        await this.l2TransactionRepository.addLiveTransaction(record, trx)
      } else {
        this.logger.error(
          'Error parsing Live L2 Transaction',
          transaction.parseError
        )
      }
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
