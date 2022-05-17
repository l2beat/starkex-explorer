import { Hash256, Timestamp } from '@explorer/types'

import {
  Record as Transaction,
  TransactionStatusRepository,
} from '../peripherals/database/TransactionStatusRepository'
import {
  EthereumClient,
  isReverted,
} from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'

type CheckResult =
  | { status: 'mined'; minedAt: Timestamp; blockNumber: number }
  | { status: 'not found' }
  | { status: 'reverted' }

export function applyCheckResult(
  transaction: Transaction,
  result: CheckResult,
  now = Date.now
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
          forgottenAt: Timestamp(now()),
        }
      }
      return {
        ...transaction,
        notFoundRetries: transaction.notFoundRetries - 1,
      }
    case 'reverted':
      return {
        ...transaction,
        revertedAt: Timestamp(now()),
      }
  }
}

export class TransactionStatusService {
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
    if (isReverted(receipt)) {
      return { status: 'reverted' }
    }
    const blockNumber = receipt.blockNumber
    const block = await this.ethereumClient.getBlock(blockNumber)
    return {
      status: 'mined',
      blockNumber,
      minedAt: Timestamp.fromSeconds(block.timestamp),
    }
  }

  async syncTransaction(transaction: Transaction): Promise<void> {
    const result = await this.checkTransaction(transaction.hash)
    const updated = applyCheckResult(transaction, result)
    await this.transactionStatusRepository.updateWaitingToBeMined(updated)
  }

  async syncTransactions(): Promise<void> {
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
}
