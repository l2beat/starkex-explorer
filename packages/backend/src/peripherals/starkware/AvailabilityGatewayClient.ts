import { Agent } from 'https'
import fetch from 'node-fetch'

import { PerpetualBatchResponse, SpotBatchResponse } from './types'

export interface AvailabilityGatewayOptions {
  url: string
  serverCertificate: string
  userCertificate: string
  userKey: string
}

export class AvailabilityGatewayClient {
  private agent: Agent

  constructor(private options: AvailabilityGatewayOptions) {
    this.agent = new Agent({
      ca: options.serverCertificate,
      cert: options.userCertificate,
      key: options.userKey,
    })
  }

  async getPerpetualBatch(batchId: number) {
    const data = await this.getBatch(batchId)
    return PerpetualBatchResponse.parse(data)
    // TODO: transform into domain types
  }

  async getSpotBatch(batchId: number) {
    const data = await this.getBatch(batchId)
    return SpotBatchResponse.parse(data)
    // TODO: transform into domain types
  }

  private async getBatch(batchId: number): Promise<unknown> {
    const method = 'availability_gateway/get_batch_data'
    const url = `${this.options.url}/${method}?batch_id=${batchId}`
    const res = await fetch(url, { agent: this.agent, timeout: 5_000 })
    return res.json()
  }
}
