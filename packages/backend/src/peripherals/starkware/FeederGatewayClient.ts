import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { Logger } from '../../tools/Logger'
import { BaseClient } from './BaseClient'
import { FetchClient } from './FetchClient'
import { PerpetualBatchInfoResponse } from './schema/PerpetualBatchInfoResponse'
import { toPerpetualBatchInfo } from './toPerpetualBatchInfo'

export class FeederGatewayClient extends BaseClient {
  constructor(
    private readonly options: GatewayConfig,
    private readonly fetchClient: FetchClient,
    private readonly logger: Logger
  ) {
    super(options.auth)
    this.logger = this.logger.for(this)
  }

  async getPerpetualBatchInfo(batchId: number) {
    const data = await this.getBatchInfo(batchId)

    if (data === undefined) {
      return undefined
    }

    const parsed = PerpetualBatchInfoResponse.parse(data)
    return toPerpetualBatchInfo(parsed)
  }

  private async getBatchInfo(batchId: number): Promise<unknown> {
    const url = this.options.getUrl(batchId)

    try {
      const res = await this.fetchClient.fetchRetry(url, {
        ...this.requestInit,
        // Some of the requests can take a long time to complete e.g. batchId = 1914
        timeout: 60_000,
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await res.json()
      // Starkex instead of 404 returns 200 with code and message, thats why we need to handle it this way.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (data.code) {
        this.logger.error(
          `Failed to fetch batch info from FeederGateway for batchId: ${batchId} | ${JSON.stringify(
            data
          )}`
        )
        return undefined
      }
      return data as unknown
    } catch (err) {
      this.logger.error(
        `Failed to fetch batch info from FeederGateway for batchId: ${batchId}`,
        err
      )
      return undefined
    }
  }
}
