import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { BaseClient } from './BaseClient'
import { FetchClient } from './FetchClient'
import { PerpetualBatchInfoResponse } from './schema'

export class FeederGatewayClient extends BaseClient {
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
