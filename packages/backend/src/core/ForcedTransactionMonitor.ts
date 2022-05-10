import { Hash256, Timestamp } from '@explorer/types'
import promiseRetry from 'promise-retry'

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

  private async waitForTransaction(hash: Hash256) {
    try {
      return await promiseRetry(
        (retry) => {
          return this.ethereumClient
            .getTransaction(hash)
            .then((transaction) => {
              if (!transaction) {
                throw new Error('Transaction not found')
              }
              return transaction
            })
            .catch(retry)
        },
        { factor: 2, forever: false, retries: 10 }
      )
    } catch (error) {
      console.error(error) // TODO: log properly
      return null
    }
  }

  private async waitForReceipt(hash: Hash256) {
    return promiseRetry(
      (retry) =>
        this.ethereumClient.waitForTransactionReceipt(hash).catch(retry),
      { forever: true }
    )
  }

  async watchTransaction(tx: ForcedTransaction) {
    const transaction = await this.waitForTransaction(tx.hash)
    if (!transaction) {
      await this.forcedTransactionRepository.delete(tx.hash)
      return
    }
    const receipt = await this.waitForReceipt(tx.hash)
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

    await this.forcedTransactionRepository.addEvents([event])
  }
}
