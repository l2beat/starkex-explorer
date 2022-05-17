import { Hash256, Timestamp } from '@explorer/types'
import { TransactionStatusRepository } from '../peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'

const MINUTE = 1000 * 60

type CheckResult =
  | { status: 'mined'; minedAt: Timestamp; blockNumber: number }
  | { status: 'not found' }
  | { status: 'reverted'; revertedAt: Timestamp }

export class TransactionStatusMonitor {
  private timeout?: NodeJS.Timeout

  constructor(
    private readonly transactionStatusRepository: TransactionStatusRepository,
    private readonly ethereumClient: EthereumClient,
    private logger: Logger
  ) {
    this.logger = this.logger.for(this)
  }

  async checkTransaction(hash: Hash256): Promise<CheckResult> {
    const transaction = await this.ethereumClient.getTransaction(hash)
    if (!transaction) {
      return { status: 'not found' }
    }
    const receipt = await this.ethereumClient.getTransactionReceipt(hash)
    if (receipt.status === 0) {
      return { status: 'reverted', revertedAt: Timestamp(Date.now()) }
    }
    const blockNumber = receipt.blockNumber
    const block = await this.ethereumClient.getBlock(blockNumber)
    return {
      status: 'mined',
      blockNumber,
      minedAt: Timestamp.fromSeconds(block.timestamp),
    }
  }

  private async handleTransactionCheck(
    hash: Hash256,
    result: CheckResult
  ): Promise<void> {
    switch (result.status) {
      case 'mined':
        await this.transactionStatusRepository.markSentAsMined(
          hash,
          result.blockNumber,
          result.minedAt
        )
        break
      case 'not found':
        // TODO: handle retries
        await this.transactionStatusRepository.markSentAsForgotten(
          hash,
          Timestamp(Date.now())
        )
        break
      case 'reverted':
        await this.transactionStatusRepository.markSentAsReverted(
          hash,
          result.revertedAt
        )
        break
    }
  }

  private async syncTransaction(hash: Hash256): Promise<void> {
    const result = await this.checkTransaction(hash)
    await this.handleTransactionCheck(hash, result)
  }

  private async syncTransactions(): Promise<void> {
    const transactions = await this.transactionStatusRepository.getByStatus(
      'sent'
    )
    await Promise.allSettled(
      transactions.map(async ({ hash }) => {
        try {
          await this.syncTransaction(hash)
        } catch (error) {
          this.logger.error(error)
        }
      })
    )
  }

  private scheduleNextCheck() {
    this.timeout = setTimeout(async () => {
      await this.syncTransactions()
      this.scheduleNextCheck()
    }, MINUTE)
  }

  start() {
    this.scheduleNextCheck()
  }

  stop() {
    if (!this.timeout) {
      return
    }
    clearTimeout(this.timeout)
  }
}
