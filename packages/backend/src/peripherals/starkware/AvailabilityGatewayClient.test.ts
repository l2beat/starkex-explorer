import { expect, mockFn, mockObject } from 'earl'

import { GatewayAuth, GatewayConfig } from '../../config/starkex/StarkexConfig'
import {
  EXAMPLE_PERPETUAL_BATCH,
  EXAMPLE_SPOT_BATCH,
} from '../../test/starkwareData'
import { AvailabilityGatewayClient } from './AvailabilityGatewayClient'
import { FetchClient } from './FetchClient'
import { PerpetualBatchResponse, SpotBatchResponse } from './schema'
import { toPerpetualBatch } from './toPerpetualBatch'
import { toSpotBatch } from './toSpotBatch'

describe(AvailabilityGatewayClient.name, () => {
  const getUrl = mockFn().returns('gateway-url')
  const options: GatewayConfig = mockObject({
    getUrl,
    auth: {} as GatewayAuth,
  })

  describe(AvailabilityGatewayClient.prototype.getPerpetualBatch.name, () => {
    it('should fetch batch and parse it to perpetual batch', async () => {
      const fetchClient = mockObject<FetchClient>({
        fetchRetry: mockFn().resolvesTo({
          json: mockFn().resolvesTo(EXAMPLE_PERPETUAL_BATCH),
        }),
      })
      const availabilityGatewayClient = new AvailabilityGatewayClient(
        options,
        fetchClient
      )

      const response = await availabilityGatewayClient.getPerpetualBatch(0)
      expect(getUrl).toHaveBeenCalledWith(0)
      expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
        'gateway-url',
        expect.anything()
      )
      expect(fetchClient.fetchRetry).toHaveBeenExhausted()
      expect(getUrl).toHaveBeenExhausted()
      expect(response).toEqual(
        toPerpetualBatch(PerpetualBatchResponse.parse(EXAMPLE_PERPETUAL_BATCH))
      )
    })

    it('should fetch batch and parse it to spot batch', async () => {
      const fetchClient = mockObject<FetchClient>({
        fetchRetry: mockFn().resolvesTo({
          json: mockFn().resolvesTo(EXAMPLE_SPOT_BATCH),
        }),
      })
      const availabilityGatewayClient = new AvailabilityGatewayClient(
        options,
        fetchClient
      )

      const response = await availabilityGatewayClient.getSpotBatch(0)
      expect(getUrl).toHaveBeenCalledWith(0)
      expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
        'gateway-url',
        expect.anything()
      )
      expect(fetchClient.fetchRetry).toHaveBeenExhausted()
      expect(getUrl).toHaveBeenExhausted()
      expect(response).toEqual(
        toSpotBatch(SpotBatchResponse.parse(EXAMPLE_SPOT_BATCH))
      )
    })
  })

  //TODO: Add test for getSpotBatch with invalid response
})
