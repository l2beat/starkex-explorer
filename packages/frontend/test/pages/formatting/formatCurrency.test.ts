import { AssetId } from '@explorer/types'
import { expect } from 'earljs'
import { formatCurrency } from '../../../src/pages/formatting'

describe(formatCurrency.name, () => {
  const cases: [bigint, AssetId | 'USD', string][] = [
    [0n, AssetId('ETH-9'), '0.000000000 ETH'],
    [0n, AssetId.USDC, '0.000000 USDC'],
    [0n, 'USD', '$0.00'],
    [1n, AssetId('ETH-9'), '0.000000001 ETH'],
    [1n, AssetId.USDC, '0.000001 USDC'],
    [1n, 'USD', '$0.01'],
    [1234567890123n, AssetId('ETH-9'), '1,234.567890123 ETH'],
    [1234567890123n, AssetId.USDC, '1,234,567.890123 USDC'],
    [1234567890123n, 'USD', '$12,345,678,901.23'],
  ]

  for (const [value, asset, expected] of cases) {
    it(`formats ${value} of ${asset} as ${expected}`, () => {
      const result = formatCurrency(value, asset)
      expect(result).toEqual(expected)
    })
  }
})
