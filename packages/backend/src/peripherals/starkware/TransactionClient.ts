import { TransactionApiConfig } from '../../config/starkex/StarkexConfig'
import { BaseClient } from './BaseClient'
import { FetchClient } from './FetchClient'
import { PerpetualTransactionResponse } from './schema'
import { toPerpetualTransactions } from './toPerpetualTransactions'

export class TransactionClient extends BaseClient {
  constructor(
    private readonly options: TransactionApiConfig,
    private readonly fetchClient: FetchClient
  ) {
    super(options.auth)
  }

  async getPerpetualTransactions(startId: number, pageSize: number) {
    const data = await this.getTransactions(startId, pageSize)
    console.log(data)

    const parsed = PerpetualTransactionResponse.parse(data)
    return toPerpetualTransactions(parsed)
  }

  private async getTransactions(
    startId: number,
    pageSize: number
  ): Promise<unknown> {
    const url = this.options.getUrl(startId, pageSize)

    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    return res.json()
  }
}
