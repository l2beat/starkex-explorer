import { Hash256, Timestamp } from '@explorer/types'
import {
  TransactionStatusRepository,
  Record as Transaction,
} from '../peripherals/database/TransactionStatusRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'

const MINUTE = 1000 * 60

type CheckResult =
  | { status: 'mined'; minedAt: Timestamp; blockNumber: number }
  | { status: 'not found' }
  | { status: 'reverted'; revertedAt: Timestamp }

function applyCheckResult(
  transaction: Transaction,
  result: CheckResult
): Transaction {
  switch (result.status) {
    case 'mined':
      return {
        ...transaction,
        mined: {
          at: result.minedAt,
          blockNumber: result.blockNumber,
        },
      }
    case 'not found':
      if (transaction.notFoundRetries === 0) {
        return {
          ...transaction,
          forgottenAt: Timestamp(Date.now()),
        }
      }
      return {
        ...transaction,
        notFoundRetries: transaction.notFoundRetries - 1,
      }
    case 'reverted':
      return {
        ...transaction,
        revertedAt: Timestamp(Date.now()),
      }
  }
}

export class TransactionStatusMonitor {
  private timeout?: NodeJS.Timeout

  constructor(
    private readonly transactionStatusRepository: TransactionStatusRepository,
    private readonly ethereumClient: EthereumClient,
    private logger: Logger,
    private readonly syncInterval = MINUTE
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

  private async syncTransaction(transaction: Transaction): Promise<void> {
    const result = await this.checkTransaction(transaction.hash)
    const updated = applyCheckResult(transaction, result)
    await this.transactionStatusRepository.updateWaitingToBeMined(updated)
  }

  private async syncTransactions(): Promise<void> {
    const transactions =
      await this.transactionStatusRepository.getWaitingToBeMined()
    await Promise.allSettled(
      transactions.map(async (transaction) => {
        try {
          await this.syncTransaction(transaction)
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
    }, this.syncInterval)
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
