import { assertUnreachable } from '@explorer/shared'
import { Agent } from 'https'
import { RequestInit } from 'node-fetch'

import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { FetchClient } from './FetchClient'
import { PerpetualBatchResponse, SpotBatchResponse } from './schema'
import { toPerpetualBatch } from './toPerpetualBatch'
import { toSpotBatch } from './toSpotBatch'

export class AvailabilityGatewayClient {
  private requestInit: RequestInit

  constructor(
    private options: GatewayConfig,
    private readonly fetchClient: FetchClient
  ) {
    this.requestInit = this.getRequestInit(options)
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
    const url = `${this.options.url}?${this.options.queryParam}=${batchId}`

    const res = await this.fetchClient.fetchRetry(url, this.requestInit)
    return res.json()
  }

  private getRequestInit(options: GatewayConfig): RequestInit {
    switch (options.auth.type) {
      case 'certificates':
        return {
          agent: new Agent({
            ca: options.auth.serverCertificate,
            cert: options.auth.userCertificate,
            key: options.auth.userKey,
          }),
        }
      case 'bearerToken':
        return {
          headers: {
            Authorization: `Bearer ${options.auth.bearerToken}`,
          },
        }
      default:
        assertUnreachable(options.auth)
    }
  }
}
