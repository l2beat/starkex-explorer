import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { FetchClient } from './FetchClient'
import { GatewayClient } from './GatewayClient'
import { PerpetualBatchDataResponse, SpotBatchDataResponse } from './schema'
import { toPerpetualBatchData } from './toPerpetualBatchData'
import { toSpotBatchData } from './toSpotBatchData'

export class AvailabilityGatewayClient extends GatewayClient {
  constructor(
    private readonly options: GatewayConfig,
    private readonly fetchClient: FetchClient
  ) {
    super(options.auth)
  }

  async getPerpetualBatchData(batchId: number) {
    const data = await this.getBatchData(batchId)
    const parsed = PerpetualBatchDataResponse.parse(data)
    return toPerpetualBatchData(parsed)
  }

  async getSpotBatchData(batchId: number) {
    const data = await this.getBatchData(batchId)
    const parsed = SpotBatchDataResponse.parse(data)
    return toSpotBatchData(parsed)
  }

  private async getBatchData(batchId: number): Promise<unknown> {
    const url = this.options.getUrl(batchId)

    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    return res.json()
  }
}
