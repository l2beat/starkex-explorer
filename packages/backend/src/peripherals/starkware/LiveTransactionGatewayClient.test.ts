import { expect, mockFn, mockObject } from 'earl'

import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { EXAMPLE_PERPETUAL_LIVE_TRANSACTIONS } from '../../test/starkwareData'
import { FetchClient } from './FetchClient'
import { LiveTransactionsGatewayClient } from './LiveTransactionGatewayClient'
import { PerpetualLiveTransactionResponse } from './schema'

describe(LiveTransactionsGatewayClient.name, () => {
  const getUrl = mockFn().returns('gateway-url')
  const options: GatewayConfig = mockObject({
    getUrl,
    auth: {
      type: 'bearerToken',
      bearerToken: 'random-token',
    },
  })

  describe(
    LiveTransactionsGatewayClient.prototype.getPerpetualLiveTransactions.name,
    () => {
      const fetchClient = mockObject<FetchClient>({
        fetchRetry: mockFn().resolvesTo({
          json: mockFn().resolvesTo(EXAMPLE_PERPETUAL_LIVE_TRANSACTIONS),
        }),
      })
      const liveTransactionsGatewayClient = new LiveTransactionsGatewayClient(
        options,
        fetchClient
      )

      it('should fetch live transactions and parse them', async () => {
        const response =
          await liveTransactionsGatewayClient.getPerpetualLiveTransactions(0, 0)

        expect(getUrl).toHaveBeenCalledWith(0, 0)
        expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
          'gateway-url',
          expect.anything()
        )
        expect(fetchClient.fetchRetry).toHaveBeenExhausted()
        expect(getUrl).toHaveBeenExhausted()
        expect(response).toEqual(
          PerpetualLiveTransactionResponse.parse(
            EXAMPLE_PERPETUAL_LIVE_TRANSACTIONS
          )
        )
      })
    }
  )
})
