import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { FetchClient } from './FetchClient'
import { GatewayClient } from './GatewayClient'
import { PerpetualBatchResponse, SpotBatchResponse } from './schema'
import { toPerpetualBatch } from './toPerpetualBatch'
import { toSpotBatch } from './toSpotBatch'

export class AvailabilityGatewayClient extends GatewayClient {
  constructor(
    private readonly options: GatewayConfig,
    private readonly fetchClient: FetchClient
  ) {
    super(options.auth)
  }

  async getPerpetualBatch(batchId: number) {
    const data = await this.getBatch(batchId)
    const parsed = PerpetualBatchResponse.parse(data)
    return toPerpetualBatch(parsed)
  }

  async getSpotBatch(batchId: number) {
    const data = await this.getBatch(batchId)
    const parsed = SpotBatchResponse.parse(data)
    return toSpotBatch(parsed)
  }

  private async getBatch(batchId: number): Promise<unknown> {
    const url = this.options.getUrl(batchId)

    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    return res.json()
  }
}
