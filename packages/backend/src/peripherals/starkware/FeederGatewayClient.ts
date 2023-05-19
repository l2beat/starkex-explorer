import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { FetchClient } from './FetchClient'
import { GatewayClient } from './GatewayClient'
import { PerpetualBatchInfoResponse } from './schema'

export class FeederGatewayClient extends GatewayClient {
  constructor(
    private readonly options: GatewayConfig,
    private readonly fetchClient: FetchClient
  ) {
    super(options.auth)
  }

  async getPerpetualBatchInfo(batchId: number) {
    const data = await this.getBatchInfo(batchId)
    const parsed = PerpetualBatchInfoResponse.parse(data)
    return parsed // TODO: toPerpetualTransactionBatchResponse(parsed)
  }

  private async getBatchInfo(batchId: number): Promise<unknown> {
    const url = this.options.getUrl(batchId)

    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    return res.json()
  }
}
