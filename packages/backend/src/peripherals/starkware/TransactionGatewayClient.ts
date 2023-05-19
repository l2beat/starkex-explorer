import { TransactionGatewayConfig } from '../../config/starkex/StarkexConfig'
import { FetchClient } from './FetchClient'
import { GatewayClient } from './GatewayClient'
import { PerpetualTransactionResponse } from './schema'
import { toPerpetualTransactions } from './toPerpetualTransactions'

export class TransactionGatewayClient extends GatewayClient {
  constructor(
    private readonly options: TransactionGatewayConfig,
    private readonly fetchClient: FetchClient
  ) {
    super(options.auth)
  }

  async getPerpetualTransactions(startApexId: number, expectCount: number) {
    const data = await this.getTransactions(startApexId, expectCount)
    const parsed = PerpetualTransactionResponse.parse(data)
    return toPerpetualTransactions(parsed)
  }

  private async getTransactions(
    startApexId: number,
    expectCount: number
  ): Promise<unknown> {
    const url = this.options.getUrl(startApexId, expectCount)

    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    return res.json()
  }
}
