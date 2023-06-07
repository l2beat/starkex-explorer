import { expect, mockFn, mockObject } from 'earl'

import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { EXAMPLE_PERPETUAL_TRANSACTIONS } from '../../test/starkwareData'
import { FetchClient } from './FetchClient'
import { L2TransactionClient } from './L2TransactionClient'
import { PerpetualL2TransactionResponse } from './schema'
import { toPerpetualL2Transactions } from './toPerpetualTransactions'

describe(L2TransactionClient.name, () => {
  const getUrl = mockFn().returns('gateway-url')
  const options: GatewayConfig = mockObject({
    getUrl,
    auth: {
      type: 'bearerToken',
      bearerToken: 'random-token',
    },
  })

  describe(L2TransactionClient.prototype.getPerpetualTransactions.name, () => {
    const fetchClient = mockObject<FetchClient>({
      fetchRetry: mockFn().resolvesTo({
        json: mockFn().resolvesTo(EXAMPLE_PERPETUAL_TRANSACTIONS),
      }),
    })
    const transactionClient = new L2TransactionClient(options, fetchClient)

    it('should fetch transactions and parse them', async () => {
      const response = await transactionClient.getPerpetualTransactions(0, 0)

      expect(getUrl).toHaveBeenCalledWith(0, 0)
      expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
        'gateway-url',
        expect.anything()
      )
      expect(fetchClient.fetchRetry).toHaveBeenExhausted()
      expect(getUrl).toHaveBeenExhausted()
      expect(response).toEqual(
        toPerpetualL2Transactions(
          PerpetualL2TransactionResponse.parse(EXAMPLE_PERPETUAL_TRANSACTIONS)
        )
      )
    })
  })
})
