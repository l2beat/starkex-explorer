import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { FetchClient } from './FetchClient'
import { GatewayClient } from './GatewayClient'
import { PerpetualTransactionBatchResponse } from './schema'

export class FeederGatewayClient extends GatewayClient {
  constructor(
    private readonly options: GatewayConfig,
    private readonly fetchClient: FetchClient
  ) {
    super(options.auth)
  }

  async getPerpetualTransactionBatch(batchId: number) {
    const data = await this.getTransactionBatch(batchId)
    const parsed = PerpetualTransactionBatchResponse.parse(data)
    return parsed // TODO: toPerpetualTransactionBatchResponse(parsed)
  }

  private async getTransactionBatch(batchId: number): Promise<unknown> {
    const url = this.options.getUrl(batchId)

    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    return res.json()
  }
}
