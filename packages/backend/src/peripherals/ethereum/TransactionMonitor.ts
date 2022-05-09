import { Hash256 } from '@explorer/types'
import { assert } from 'console'
import { providers } from 'ethers'

import { EthereumClient } from './EthereumClient'

type FinalTransactionStatus = 'forgotten' | 'reverted' | 'mined'

const MAX_RETRIES = 10

const finalStatusFromReceipt = (status?: number) => {
  return status === 0 ? 'reverted' : 'mined'
}

const _wait = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay))

export class TransactionMonitor {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly wait = _wait
  ) {}

  async waitForTransaction(
    hash: Hash256,
    retries = MAX_RETRIES
  ): Promise<providers.TransactionResponse | null> {
    assert(retries >= 0)
    let transaction = null
    let i = 0
    while (!transaction && i <= retries) {
      try {
        if (i > 0) await this.wait(Math.pow(2, i - 1) * 1000)
        transaction = await this.ethereumClient.getTransaction(hash)
      } catch (error) {
        console.error(error) // TODO: log properly
      } finally {
        i = i + 1
      }
    }
    return transaction
  }

  async getFinalStatus(
    hash: Hash256,
    retries = MAX_RETRIES
  ): Promise<FinalTransactionStatus> {
    assert(retries >= 0)
    const transaction = await this.waitForTransaction(hash, retries)
    if (!transaction) {
      return 'forgotten'
    }
    try {
      const receipt = await transaction.wait()
      return finalStatusFromReceipt(receipt.status)
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (error as any).receipt?.status
      if (!status) {
        throw error
      }
      return finalStatusFromReceipt(status)
    }
  }
}
