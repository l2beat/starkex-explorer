import { Hash256, Timestamp } from '@explorer/types'

import { SentTransactionRepository } from '../peripherals/database/transactions/SentTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'

const DEFAULT_MAX_MISSING = 10

export class TransactionStatusService {
  private missingMap = new Map<Hash256, number>()

  constructor(
    private readonly sentTransactionRepository: SentTransactionRepository,
    private readonly ethereumClient: EthereumClient,
    private logger: Logger,
    private maxMissing = DEFAULT_MAX_MISSING
  ) {
    this.logger = this.logger.for(this)
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
      const missing = this.missingMap.get(hash) ?? 0
      if (missing > this.maxMissing) {
        return this.sentTransactionRepository.deleteByTransactionHash(hash)
      }
      this.missingMap.set(hash, missing + 1)
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
