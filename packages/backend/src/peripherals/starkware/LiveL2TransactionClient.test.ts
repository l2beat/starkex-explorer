import { Logger } from '@l2beat/backend-tools'
import { expect, mockFn, mockObject } from 'earl'

import { LiveL2TransactionApiConfig } from '../../config/starkex/StarkexConfig'
import { EXAMPLE_PERPETUAL_TRANSACTIONS } from '../../test/starkwareData'
import { FetchClient } from './FetchClient'
import { LiveL2TransactionClient } from './LiveL2TransactionClient'
import { PerpetualLiveL2TransactionResponse } from './schema/PerpetualLiveL2TransactionResponse'
import { toPerpetualL2Transactions } from './toPerpetualTransactions'

describe(LiveL2TransactionClient.name, () => {
  const getTransactionsUrl = mockFn().returns('get-transactions-url')
  const getThirdPartyIdByTransactionIdUrl = mockFn().returns(
    'get-third-party-id-by-transaction-id-url'
  )
  const options: LiveL2TransactionApiConfig = {
    getTransactionsUrl,
    getThirdPartyIdByTransactionIdUrl,
    auth: {
      type: 'bearerToken',
      bearerToken: 'random-token',
    },
  }

  describe(
    LiveL2TransactionClient.prototype.getPerpetualLiveTransactions.name,
    () => {
      it('should fetch transactions and parse them', async () => {
        const fetchClient = mockObject<FetchClient>({
          fetchRetry: mockFn().resolvesTo({
            json: mockFn().resolvesTo(EXAMPLE_PERPETUAL_TRANSACTIONS),
          }),
        })
        const transactionClient = new LiveL2TransactionClient(
          options,
          fetchClient,
          Logger.SILENT
        )

        const response = await transactionClient.getPerpetualLiveTransactions(
          0,
          0
        )

        expect(getTransactionsUrl).toHaveBeenCalledWith(0, 0)
        expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
          'get-transactions-url',
          expect.anything()
        )
        expect(response).toEqual(
          toPerpetualL2Transactions(
            PerpetualLiveL2TransactionResponse.parse(
              EXAMPLE_PERPETUAL_TRANSACTIONS
            ),
            Logger.SILENT
          )
        )
      })

      it('should return undefined if no transactions are returned', async () => {
        const fetchClient = mockObject<FetchClient>({
          fetchRetry: mockFn().resolvesTo({
            json: mockFn().resolvesTo({}),
          }),
        })
        const transactionClient = new LiveL2TransactionClient(
          options,
          fetchClient,
          Logger.SILENT
        )

        const response = await transactionClient.getPerpetualLiveTransactions(
          0,
          0
        )

        expect(getTransactionsUrl).toHaveBeenCalledWith(0, 0)
        expect(fetchClient.fetchRetry).toHaveBeenCalledWith(
          'get-transactions-url',
          expect.anything()
        )
        expect(response).toEqual(undefined)
      })
    }
  )

  describe(
    LiveL2TransactionClient.prototype.getThirdPartyIdByTransactionId.name,
    () => {
      it('should fetch third party id', async () => {
        const textResponse = '2'
        const fetchClient = mockObject<FetchClient>({
          fetchRetry: mockFn().resolvesTo({
            text: mockFn().resolvesTo(textResponse),
          }),
        })
        const transactionClient = new LiveL2TransactionClient(
          options,
          fetchClient,
          Logger.SILENT
        )

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
          const transactionClient = new LiveL2TransactionClient(
            options,
            fetchClient,
            Logger.SILENT
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
