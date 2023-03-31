import { AssetId } from '@explorer/types'
import { expect } from 'earl'

import { formatCurrencyInput } from './formatCurrencyInput'

describe(formatCurrencyInput.name, () => {
  it('formats a positive number', () => {
    const formatted = formatCurrencyInput(100n, AssetId('USDC-9'))
    expect(formatted).toEqual('0.0000001')
  })

  it('formats a negative number', () => {
    const formatted = formatCurrencyInput(-100n, AssetId('ETH-6'))
    expect(formatted).toEqual('0.0001')
  })
})
