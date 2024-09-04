import { EthereumAddress, Hash256 } from '@explorer/types'

import { ControllerResult } from '../api/controllers/ControllerResult'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { sleep } from '../tools/sleep'

type DecodeResult<T> =
  | { isSuccess: true; data: T }
  | { isSuccess: false; controllerResult: ControllerResult }

export class TransactionValidator {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly retryTransactions = true
  ) {}

  async fetchTxAndDecode<T>(
    transactionHash: Hash256,
    to: EthereumAddress,
    decodeFn: (data: string) => T | undefined
  ): Promise<DecodeResult<T>> {
    const tx = await this.getTransaction(transactionHash)
    if (!tx) {
      return {
        isSuccess: false,
        controllerResult: {
          type: 'bad request',
          message: `Transaction ${transactionHash.toString()} not found`,
        },
      }
    }
    const data = decodeFn(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== to || !data) {
      return {
        isSuccess: false,
        controllerResult: {
          type: 'bad request',
          message: 'Invalid transaction',
        },
      }
    }

    return { isSuccess: true, data }
  }

  private async getTransaction(hash: Hash256) {
    if (!this.retryTransactions) {
      return this.ethereumClient.getTransaction(hash)
    }
    for (const ms of [0, 1000, 4000]) {
      if (ms) {
        await sleep(ms)
      }
      const tx = await this.ethereumClient.getTransaction(hash)
      if (tx) {
        return tx
      }
    }
  }
}
