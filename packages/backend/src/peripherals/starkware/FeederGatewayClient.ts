import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { BaseClient } from './BaseClient'
import { FetchClient } from './FetchClient'
import { PerpetualBatchInfoResponse } from './schema'
import { toPerpetualBatchInfo } from './toPerpetualBatchInfo'

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
    return toPerpetualBatchInfo(parsed)
  }

  private async getBatchInfo(batchId: number): Promise<unknown> {
    const url = this.options.getUrl(batchId)

    const res = await this.fetchClient.fetchRetry(url, {
      ...this.requestInit,
      // Some of the requests can take a long time to complete e.g. batchId = 1914
      timeout: 15_000,
    })
    return res.json()
  }
}
