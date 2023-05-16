import { LiveTransactionGatewayConfig } from '../../config/starkex/StarkexConfig'
import { FetchClient } from './FetchClient'
import { GatewayClient } from './GatewayClient'
import { PerpetualLiveTransactionResponse } from './schema'

export class LiveTransactionsGatewayClient extends GatewayClient {
  constructor(
    private readonly options: LiveTransactionGatewayConfig,
    private readonly fetchClient: FetchClient
  ) {
    super(options.auth)
  }

  async getPerpetualLiveTransactions(startApexId: number, expectCount: number) {
    const data = await this.getLiveTransactions(startApexId, expectCount)
    const parsed = PerpetualLiveTransactionResponse.parse(data)

    return parsed // TODO: PerpetualLiveTransactionResponse(parsed)
  }

  private async getLiveTransactions(startApexId: number, expectCount: number) {
    const url = this.options.getUrl(startApexId, expectCount)

    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    return res.json()
  }
}
