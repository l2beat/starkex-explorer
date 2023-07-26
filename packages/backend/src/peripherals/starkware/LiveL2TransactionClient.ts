import isEmpty from 'lodash/isEmpty'

import { LiveL2TransactionApiConfig } from '../../config/starkex/StarkexConfig'
import { BaseClient } from './BaseClient'
import { FetchClient } from './FetchClient'
import { PerpetualLiveL2TransactionResponse } from './schema/PerpetualLiveL2TransactionResponse'
import { toPerpetualL2Transactions } from './toPerpetualTransactions'

export class LiveL2TransactionClient extends BaseClient {
  constructor(
    private readonly options: LiveL2TransactionApiConfig,
    private readonly fetchClient: FetchClient
  ) {
    super(options.auth)
  }

  async getThirdPartyIdByTransactionId(transactionId: number) {
    const url = this.options.getThirdPartyIdByTransactionIdUrl(transactionId)

    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    const text = await res.text()
    const thirdPartyId = Number(text)
    // thirdPartyId is equal 0 if the transaction is not found
    return thirdPartyId !== 0 ? thirdPartyId : undefined
  }

  async getPerpetualLiveTransactions(startId: number, pageSize: number) {
    const data = await this.getTransactions(startId, pageSize)

    if (isEmpty(data)) {
      return undefined
    }

    const parsed = PerpetualLiveL2TransactionResponse.parse(data)
    return toPerpetualL2Transactions(parsed)
  }

  private async getTransactions(
    startId: number,
    pageSize: number
  ): Promise<unknown> {
    const url = this.options.getTransactionsUrl(startId, pageSize)
    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    return res.json()
  }
}
