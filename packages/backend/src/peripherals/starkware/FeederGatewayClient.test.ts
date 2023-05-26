import { expect, mockFn, mockObject } from 'earl'

import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { EXAMPLE_PERPETUAL_BATCH_INFO } from '../../test/starkwareData'
import { FeederGatewayClient } from './FeederGatewayClient'
import { FetchClient } from './FetchClient'
import { PerpetualBatchInfoResponse } from './schema'
import { toPerpetualBatchInfo } from './toPerpetualBatchInfo'

describe(FeederGatewayClient.name, () => {
  const getUrl = mockFn().returns('gateway-url')
  const options: GatewayConfig = mockObject({
    getUrl,
    auth: {
      type: 'bearerToken',
      bearerToken: 'random-token',
    },
  })

  describe(FeederGatewayClient.prototype.getPerpetualBatchInfo.name, () => {
    const fetchClient = mockObject<FetchClient>({
      fetchRetry: mockFn().resolvesTo({
        json: mockFn().resolvesTo(EXAMPLE_PERPETUAL_BATCH_INFO),
      }),
    })
    const feederGatewayClient = new FeederGatewayClient(options, fetchClient)

    it('should fetch transaction batch and parse it', async () => {
      const response = await feederGatewayClient.getPerpetualBatchInfo(0)
      expect(getUrl).toHaveBeenCalledWith(0)
      expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
        'gateway-url',
        expect.anything()
      )
      expect(fetchClient.fetchRetry).toHaveBeenExhausted()
      expect(getUrl).toHaveBeenExhausted()
      expect(response).toEqual(
        toPerpetualBatchInfo(
          PerpetualBatchInfoResponse.parse(EXAMPLE_PERPETUAL_BATCH_INFO)
        )
      )
    })
  })
})
