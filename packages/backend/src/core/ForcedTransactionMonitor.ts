import { Timestamp } from '@explorer/types'

import {
  ForcedTransaction,
  ForcedTransactionsRepository,
} from '../peripherals/database/ForcedTransactionsRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'

export class ForcedTransactionMonitor {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly forcedTransactionRepository: ForcedTransactionsRepository
  ) {}

  async startWatching() {
    const transactions = await this.forcedTransactionRepository.getPending()
    transactions.forEach((tx) => this.watchTransaction(tx))
  }

  async watchTransaction(tx: ForcedTransaction) {
    const transaction = await this.ethereumClient.getTransaction(tx.hash) // TODO: make sure we watch this long enough
    if (!transaction) {
      await this.forcedTransactionRepository.delete(tx.hash)
      return
    }
    const receipt = await this.ethereumClient.waitForTransactionReceipt(tx.hash) // TODO: handle network errors
    if (receipt.status === 0) {
      await this.forcedTransactionRepository.delete(tx.hash)
      return
    }
    const blockNumber = receipt.blockNumber
    const timestamp = Timestamp(Date.now())
    const transactionHash = tx.hash

    const event =
      tx.type === 'trade'
        ? {
            transactionType: 'trade' as const,
            eventType: 'mined' as const,
            blockNumber,
            timestamp,
            transactionHash,
            publicKeyA: tx.publicKeyA,
            publicKeyB: tx.publicKeyB,
            positionIdA: tx.positionIdA,
            positionIdB: tx.positionIdB,
            syntheticAssetId: tx.syntheticAssetId,
            isABuyingSynthetic: tx.isABuyingSynthetic,
            collateralAmount: tx.collateralAmount,
            syntheticAmount: tx.syntheticAmount,
            nonce: tx.nonce,
          }
        : {
            transactionType: 'withdrawal' as const,
            eventType: 'mined' as const,
            blockNumber,
            timestamp,
            transactionHash,
            publicKey: tx.publicKey,
            positionId: tx.positionId,
            amount: tx.amount,
          }

    this.forcedTransactionRepository.addEvents([event])
  }
}
