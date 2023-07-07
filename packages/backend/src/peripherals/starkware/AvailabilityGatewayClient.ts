import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { BaseClient } from './BaseClient'
import { FetchClient } from './FetchClient'
import { PerpetualBatchDataResponse } from './schema/PerpetualBatchDataResponse'
import { SpotBatchDataResponse } from './schema/SpotBatchDataResponse'
import { toPerpetualBatchData } from './toPerpetualBatchData'
import { toSpotBatchData } from './toSpotBatchData'

export class AvailabilityGatewayClient extends BaseClient {
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
