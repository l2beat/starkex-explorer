import { expect, mockFn, mockObject } from 'earl'

import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import {
  EXAMPLE_PERPETUAL_BATCH_DATA,
  EXAMPLE_SPOT_BATCH_DATA,
} from '../../test/starkwareData'
import { AvailabilityGatewayClient } from './AvailabilityGatewayClient'
import { FetchClient } from './FetchClient'
import { PerpetualBatchDataResponse } from './schema/PerpetualBatchDataResponse'
import { SpotBatchDataResponse } from './schema/SpotBatchDataResponse'
import { toPerpetualBatchData } from './toPerpetualBatchData'
import { toSpotBatchData } from './toSpotBatchData'

describe(AvailabilityGatewayClient.name, () => {
  const getUrl = mockFn().returns('gateway-url')
  const options: GatewayConfig = mockObject({
    getUrl,
    auth: {
      type: 'bearerToken',
      bearerToken: 'random-token',
    },
  })

  describe(
    AvailabilityGatewayClient.prototype.getPerpetualBatchData.name,
    () => {
      it('should fetch batch and parse it to perpetual batch', async () => {
        const fetchClient = mockObject<FetchClient>({
          fetchRetry: mockFn().resolvesTo({
            json: mockFn().resolvesTo(EXAMPLE_PERPETUAL_BATCH_DATA),
          }),
        })
        const availabilityGatewayClient = new AvailabilityGatewayClient(
          options,
          fetchClient
        )

        const response = await availabilityGatewayClient.getPerpetualBatchData(
          0
        )
        expect(getUrl).toHaveBeenCalledWith(0)
        expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
          'gateway-url',
          expect.anything()
        )
        expect(fetchClient.fetchRetry).toHaveBeenExhausted()
        expect(getUrl).toHaveBeenExhausted()
        expect(response).toEqual(
          toPerpetualBatchData(
            PerpetualBatchDataResponse.parse(EXAMPLE_PERPETUAL_BATCH_DATA)
          )
        )
      })

      it('should fetch batch and parse it to spot batch', async () => {
        const fetchClient = mockObject<FetchClient>({
          fetchRetry: mockFn().resolvesTo({
            json: mockFn().resolvesTo(EXAMPLE_SPOT_BATCH_DATA),
          }),
        })
        const availabilityGatewayClient = new AvailabilityGatewayClient(
          options,
          fetchClient
        )

        const response = await availabilityGatewayClient.getSpotBatchData(0)
        expect(getUrl).toHaveBeenCalledWith(0)
        expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
          'gateway-url',
          expect.anything()
        )
        expect(fetchClient.fetchRetry).toHaveBeenExhausted()
        expect(getUrl).toHaveBeenExhausted()
        expect(response).toEqual(
          toSpotBatchData(SpotBatchDataResponse.parse(EXAMPLE_SPOT_BATCH_DATA))
        )
      })
    }
  )

  //TODO: Add test for getSpotBatch with invalid response
})
