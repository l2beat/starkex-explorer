import { Hash256, Timestamp } from '@explorer/types'

import { SentTransactionRepository } from '../peripherals/database/transactions/SentTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'

const MINUTE = 1000 * 60
const DEFAULT_MAX_MISSING = 10

export interface TransactionStatusServiceOptions {
  checkIntervalMs: number
  maxMissingBeforeDelete: number
}

export class TransactionStatusService {
  private missingMap = new Map<Hash256, number>()
  private options: TransactionStatusServiceOptions

  constructor(
    private readonly sentTransactionRepository: SentTransactionRepository,
    private readonly ethereumClient: EthereumClient,
    private logger: Logger,
    options?: Partial<TransactionStatusServiceOptions>
  ) {
    this.logger = this.logger.for(this)
    this.options = {
      checkIntervalMs: options?.checkIntervalMs ?? MINUTE,
      maxMissingBeforeDelete:
        options?.maxMissingBeforeDelete ?? DEFAULT_MAX_MISSING,
    }
  }

  start() {
    this.scheduleNextCheck()
  }

  private scheduleNextCheck() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      try {
        await this.checkPendingTransactions()
      } finally {
        this.scheduleNextCheck()
      }
    }, this.options.checkIntervalMs)
  }

  async checkPendingTransactions(): Promise<void> {
    const hashes = await this.sentTransactionRepository.getNotMinedHashes()
    await Promise.allSettled(
      hashes.map(async (hash) => {
        try {
          await this.checkTransaction(hash)
        } catch (error) {
          this.logger.error(error)
        }
      })
    )
  }

  async checkTransaction(hash: Hash256) {
    const transaction = await this.ethereumClient.getTransaction(hash)
    if (!transaction) {
      const missing = (this.missingMap.get(hash) ?? 0) + 1
      this.missingMap.set(hash, missing)
      if (missing >= this.options.maxMissingBeforeDelete) {
        await this.sentTransactionRepository.deleteByTransactionHash(hash)
      }
      return
    }

    // this actually waits and polls for the transaction to be mined
    const receipt = await this.ethereumClient.getTransactionReceipt(hash)
    const blockNumber = receipt.blockNumber
    const block = await this.ethereumClient.getBlock(blockNumber)

    return this.sentTransactionRepository.updateMined(hash, {
      timestamp: Timestamp.fromSeconds(block.timestamp),
      blockNumber,
      reverted: receipt.status === 0,
    })
  }
}
