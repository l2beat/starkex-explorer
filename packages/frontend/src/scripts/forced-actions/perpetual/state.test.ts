import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import { getInitialState, nextFormState } from './state'
import { FormAction } from './types'

describe(nextFormState.name, () => {
  const INITIAL_STATE = getInitialState(
    {
      positionOrVaultId: 123n,
      starkExAddress: EthereumAddress.fake(),
      starkKey: StarkKey.fake(),
      asset: {
        hashOrId: AssetId('ETH-9'),
        balance: 69420_654321n,
        priceUSDCents: 100n,
      },
    },
    {
      starkKey: StarkKey.fake(),
      address: EthereumAddress.fake(),
    },
    {
      assetId: AssetId('USDC-6'),
      assetHash: AssetHash.fake(),
      price: 1_000_000n,
    }
  )

  function reduce(actions: FormAction[], from = INITIAL_STATE) {
    return actions.reduce((state, action) => nextFormState(state, action), from)
  }

  it('input amount', () => {
    const state = reduce([{ type: 'ModifyAmount', value: '1' }])
    expect(state).toEqual({
      ...INITIAL_STATE,
      amountInputString: '1',
      amountInputValue: 1_000000000n,
    })
  })

  it('input amount and delete', () => {
    const state = reduce([
      { type: 'ModifyAmount', value: '123' },
      { type: 'ModifyAmount', value: '' },
    ])
    expect(state).toEqual(INITIAL_STATE)
  })

  it('input amount too large for selling', () => {
    const state = reduce([{ type: 'ModifyAmount', value: '123456789' }])
    expect(state).toEqual({
      ...INITIAL_STATE,
      amountInputError: true,
      amountInputString: '123456789',
      amountInputValue: 123456789_000000000n,
    })
  })

  it('input amount for buying', () => {
    const state = reduce([{ type: 'ModifyAmount', value: '0.0001' }])
    expect(state.amountInputError).toEqual(false)
  })

  it('input amount too large for buying', () => {
    const state = reduce([
      { type: 'ModifyAmount', value: '12345678901234567890' },
    ])
    expect(state.amountInputError).toEqual(true)
  })

  it('input amount too large and delete', () => {
    const state = reduce([
      { type: 'ModifyAmount', value: '123456789' },
      { type: 'ModifyAmount', value: '12' },
    ])
    expect(state).toEqual({
      ...INITIAL_STATE,
      amountInputString: '12',
      amountInputValue: 12_000000000n,
    })
  })

  it('input price', () => {
    const state = reduce([{ type: 'ModifyPrice', value: '123' }])
    expect(state).toEqual({
      ...INITIAL_STATE,
      priceInputString: '123',
      priceInputValue: 123_000000n,
    })
  })

  it('input amount then price', () => {
    const state = reduce([
      { type: 'ModifyAmount', value: '2' },
      { type: 'ModifyPrice', value: '4' },
    ])
    expect(state).toEqual({
      ...INITIAL_STATE,
      canSubmit: true,
      amountInputString: '2',
      amountInputValue: 2_000000000n,
      priceInputString: '4',
      priceInputValue: 4_000000n,
      totalInputString: '8',
      totalInputValue: 8_000000n,
    })
  })

  it('input price then amount', () => {
    const state = reduce([
      { type: 'ModifyPrice', value: '4' },
      { type: 'ModifyAmount', value: '2' },
    ])
    expect(state).toEqual({
      ...INITIAL_STATE,
      canSubmit: true,
      amountInputString: '2',
      amountInputValue: 2_000000000n,
      priceInputString: '4',
      priceInputValue: 4_000000n,
      totalInputString: '8',
      totalInputValue: 8_000000n,
    })
  })

  it('input amount then total', () => {
    const state = reduce([
      { type: 'ModifyAmount', value: '2' },
      { type: 'ModifyTotal', value: '8' },
    ])
    expect(state).toEqual({
      ...INITIAL_STATE,
      canSubmit: true,
      boundVariable: 'total',
      amountInputString: '2',
      amountInputValue: 2_000000000n,
      priceInputString: '4',
      priceInputValue: 4_000000n,
      totalInputString: '8',
      totalInputValue: 8_000000n,
    })
  })

  it('input total then amount', () => {
    const state = reduce([
      { type: 'ModifyTotal', value: '8' },
      { type: 'ModifyAmount', value: '2' },
    ])
    expect(state).toEqual({
      ...INITIAL_STATE,
      canSubmit: true,
      boundVariable: 'total',
      amountInputString: '2',
      amountInputValue: 2_000000000n,
      priceInputString: '4',
      priceInputValue: 4_000000n,
      totalInputString: '8',
      totalInputValue: 8_000000n,
    })
  })
})
