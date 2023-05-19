import { expect, mockFn, mockObject } from 'earl'

import { GatewayConfig } from '../../config/starkex/StarkexConfig'
import { EXAMPLE_PERPETUAL_TRANSACTIONS } from '../../test/starkwareData'
import { FetchClient } from './FetchClient'
import { PerpetualTransactionResponse } from './schema'
import { toPerpetualTransactions } from './toPerpetualTransactions'
import { TransactionGatewayClient } from './TransactionGatewayClient'

describe(TransactionGatewayClient.name, () => {
  const getUrl = mockFn().returns('gateway-url')
  const options: GatewayConfig = mockObject({
    getUrl,
    auth: {
      type: 'bearerToken',
      bearerToken: 'random-token',
    },
  })

  describe(
    TransactionGatewayClient.prototype.getPerpetualTransactions.name,
    () => {
      const fetchClient = mockObject<FetchClient>({
        fetchRetry: mockFn().resolvesTo({
          json: mockFn().resolvesTo(EXAMPLE_PERPETUAL_TRANSACTIONS),
        }),
      })
      const transactionGatewayClient = new TransactionGatewayClient(
        options,
        fetchClient
      )

      it('should fetch transactions and parse them', async () => {
        const response =
          await transactionGatewayClient.getPerpetualTransactions(0, 0)

        expect(getUrl).toHaveBeenCalledWith(0, 0)
        expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
          'gateway-url',
          expect.anything()
        )
        expect(fetchClient.fetchRetry).toHaveBeenExhausted()
        expect(getUrl).toHaveBeenExhausted()
        expect(response).toEqual(
          toPerpetualTransactions(
            PerpetualTransactionResponse.parse(EXAMPLE_PERPETUAL_TRANSACTIONS)
          )
        )
      })
    }
  )
})
