import { expect, mockFn, mockObject } from 'earl'

import { L2TransactionApiConfig } from '../../config/starkex/StarkexConfig'
import { EXAMPLE_PERPETUAL_TRANSACTIONS } from '../../test/starkwareData'
import { FetchClient } from './FetchClient'
import { L2TransactionClient } from './L2TransactionClient'
import { PerpetualL2TransactionResponse } from './schema/PerpetualL2TransactionResponse'
import { toPerpetualL2Transactions } from './toPerpetualTransactions'

describe(L2TransactionClient.name, () => {
  const getTransactionsUrl = mockFn().returns('get-transactions-url')
  const getThirdPartyIdByTransactionIdUrl = mockFn().returns(
    'get-third-party-id-by-transaction-id-url'
  )
  const options: L2TransactionApiConfig = {
    getTransactionsUrl,
    getThirdPartyIdByTransactionIdUrl,
    auth: {
      type: 'bearerToken',
      bearerToken: 'random-token',
    },
  }

  describe(L2TransactionClient.prototype.getPerpetualTransactions.name, () => {
    it('should fetch transactions and parse them', async () => {
      const fetchClient = mockObject<FetchClient>({
        fetchRetry: mockFn().resolvesTo({
          json: mockFn().resolvesTo(EXAMPLE_PERPETUAL_TRANSACTIONS),
        }),
      })
      const transactionClient = new L2TransactionClient(options, fetchClient)

      const response = await transactionClient.getPerpetualTransactions(0, 0)

      expect(getTransactionsUrl).toHaveBeenCalledWith(0, 0)
      expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
        'get-transactions-url',
        expect.anything()
      )
      expect(response).toEqual(
        toPerpetualL2Transactions(
          PerpetualL2TransactionResponse.parse(EXAMPLE_PERPETUAL_TRANSACTIONS)
        )
      )
    })

    it('should return undefined if no transactions are returned', async () => {
      const fetchClient = mockObject<FetchClient>({
        fetchRetry: mockFn().resolvesTo({
          json: mockFn().resolvesTo({}),
        }),
      })
      const transactionClient = new L2TransactionClient(options, fetchClient)

      const response = await transactionClient.getPerpetualTransactions(0, 0)

      expect(getTransactionsUrl).toHaveBeenCalledWith(0, 0)
      expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
        'get-transactions-url',
        expect.anything()
      )
      expect(response).toEqual(undefined)
    })
  })

  describe(
    L2TransactionClient.prototype.getThirdPartyIdByTransactionId.name,
    () => {
      it('should fetch third party id', async () => {
        const textResponse = '2'
        const fetchClient = mockObject<FetchClient>({
          fetchRetry: mockFn().resolvesTo({
            text: mockFn().resolvesTo(textResponse),
          }),
        })
        const transactionClient = new L2TransactionClient(options, fetchClient)

        const response = await transactionClient.getThirdPartyIdByTransactionId(
          1
        )

        expect(getThirdPartyIdByTransactionIdUrl).toHaveBeenCalledWith(1)
        expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
          'get-third-party-id-by-transaction-id-url',
          expect.anything()
        )
        expect(response).toEqual(Number(textResponse))
      })

      it('should return undefined if 0 is returned', async () => {
        it('should fetch third party id', async () => {
          const fetchClient = mockObject<FetchClient>({
            fetchRetry: mockFn().resolvesTo({
              text: mockFn().resolvesTo('0'),
            }),
          })
          const transactionClient = new L2TransactionClient(
            options,
            fetchClient
          )

          const response =
            await transactionClient.getThirdPartyIdByTransactionId(1)

          expect(getThirdPartyIdByTransactionIdUrl).toHaveBeenCalledWith(1)
          expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
            'get-third-party-id-by-transaction-id-url',
            expect.anything()
          )
          expect(response).toEqual(undefined)
        })
      })
    }
  )
})
