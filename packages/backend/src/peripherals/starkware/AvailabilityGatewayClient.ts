import { assertUnreachable } from '@explorer/shared'
import { Agent } from 'https'
import fetch, { RequestInit } from 'node-fetch'

import { AvailiabilityGatewayConfig } from '../../config/starkex/StarkexConfig'
import { PerpetualBatchResponse, SpotBatchResponse } from './schema'
import { toPerpetualBatch } from './toPerpetualBatch'
import { toSpotBatch } from './toSpotBatch'

export class AvailabilityGatewayClient {
  private requestInit: RequestInit

  constructor(private options: AvailiabilityGatewayConfig) {
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

    const res = await fetch(url, { ...this.requestInit, timeout: 5_000 })
    return res.json()
  }

  private getRequestInit(options: AvailiabilityGatewayConfig): RequestInit {
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
