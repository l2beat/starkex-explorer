import { encodeFullWithdrawalFreezeRequest } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey } from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'

import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { TransactionValidator } from './TransactionValidator'

describe(TransactionValidator.prototype.fetchTxAndDecode.name, () => {
  it('handles nonexistent transaction', async () => {
    const transactionValidator = new TransactionValidator(
      mockObject<EthereumClient>({
        getTransaction: async () => undefined,
      }),
      false
    )
    const hash = Hash256.fake()
    const mockDecode = mockFn()

    const result = await transactionValidator.fetchTxAndDecode(
      hash,
      EthereumAddress.fake(),
      mockDecode
    )

    expect(result).toEqual({
      isSuccess: false,
      controllerResult: {
        type: 'bad request',
        message: `Transaction ${hash.toString()} not found`,
      },
    })
    expect(mockDecode).not.toHaveBeenCalled()
  })

  it('handles transaction with undefined "to" field', async () => {
    const data = '0x1234'
    const transactionValidator = new TransactionValidator(
      mockObject<EthereumClient>({
        getTransaction: mockFn().resolvesTo({ to: undefined, data }),
      }),
      false
    )
    const hash = Hash256.fake()
    const mockDecode = mockFn((_: string) => {})

    const result = await transactionValidator.fetchTxAndDecode(
      hash,
      EthereumAddress.fake(),
      mockDecode
    )

    expect(result).toEqual({
      isSuccess: false,
      controllerResult: {
        type: 'bad request',
        message: 'Invalid transaction',
      },
    })
    expect(mockDecode).toHaveBeenOnlyCalledWith(data)
  })

  it('handles transaction to a wrong address', async () => {
    const data = '0x1234'
    const transactionValidator = new TransactionValidator(
      mockObject<EthereumClient>({
        getTransaction: mockFn().resolvesTo({
          to: EthereumAddress.fake('b'),
          data,
        }),
      }),
      false
    )
    const hash = Hash256.fake()
    const mockDecode = mockFn((_: string) => {})

    const result = await transactionValidator.fetchTxAndDecode(
      hash,
      EthereumAddress.fake('a'),
      mockDecode
    )

    expect(result).toEqual({
      isSuccess: false,
      controllerResult: {
        type: 'bad request',
        message: 'Invalid transaction',
      },
    })
    expect(mockDecode).toHaveBeenOnlyCalledWith(data)
  })

  it('handles transaction with unknown data', async () => {
    const data = '0x1234'
    const transactionValidator = new TransactionValidator(
      mockObject<EthereumClient>({
        getTransaction: mockFn().resolvesTo({
          to: EthereumAddress.fake('a'),
          data,
        }),
      }),
      false
    )
    const hash = Hash256.fake()
    const mockDecode = mockFn().returns(undefined)

    const result = await transactionValidator.fetchTxAndDecode(
      hash,
      EthereumAddress.fake('a'),
      mockDecode
    )

    expect(result).toEqual({
      isSuccess: false,
      controllerResult: {
        type: 'bad request',
        message: 'Invalid transaction',
      },
    })
  })

  it('returns decoded data on success', async () => {
    const decodedData = {
      starkKey: StarkKey.fake(),
      vaultId: 3n,
    } as const
    const data = encodeFullWithdrawalFreezeRequest(decodedData)

    const transactionValidator = new TransactionValidator(
      mockObject<EthereumClient>({
        getTransaction: mockFn().resolvesTo({
          to: EthereumAddress.fake('a'),
          data,
        }),
      }),
      false
    )
    const hash = Hash256.fake()
    const mockDecode = mockFn().returns(decodedData)

    const result = await transactionValidator.fetchTxAndDecode(
      hash,
      EthereumAddress.fake('a'),
      mockDecode
    )

    expect(result).toEqual({
      isSuccess: true,
      data: decodedData,
    })
  })
})
