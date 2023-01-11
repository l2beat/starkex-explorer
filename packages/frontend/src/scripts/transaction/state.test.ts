import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { getInitialState, nextFormState } from './state'
import { FormAction } from './types'

describe(nextFormState.name, () => {
  const INITIAL_STATE = getInitialState(
    {
      account: {
        address: EthereumAddress.fake(),
        positionId: 123n,
        hasUpdates: false,
      },
      positionId: 123n,
      perpetualAddress: EthereumAddress.fake(),
      starkKey: StarkKey.fake(),
      selectedAsset: AssetId('ETH-9'),
      assets: [
        {
          assetId: AssetId('USDC-6'),
          balance: 69420_654321n,
          priceUSDCents: 100n,
          totalUSDCents: 69420_65n,
        },
        {
          assetId: AssetId('ETH-9'),
          balance: 21_370000000n,
          priceUSDCents: 2839_39n,
          totalUSDCents: 60678_04n,
        },
        {
          assetId: AssetId('BTC-10'),
          balance: -5287654321n,
          priceUSDCents: 38504_34n,
          totalUSDCents: -20359_76n,
        },
      ],
    },
    ''
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
    const state = reduce([
      { type: 'AssetChange', assetId: AssetId('BTC-10') },
      { type: 'ModifyAmount', value: '0.0001' },
    ])
    expect(state.amountInputError).toEqual(false)
  })

  it('input amount too large for buying', () => {
    const state = reduce([
      { type: 'AssetChange', assetId: AssetId('BTC-10') },
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
