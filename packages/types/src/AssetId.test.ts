import { expect } from 'earljs'

import { AssetId } from './AssetId'

describe(AssetId.name, () => {
  it('throws for long strings', () => {
    expect(() => AssetId('VERYLONGCRYPTOASSET-1234')).toThrow(TypeError)
  })

  it('throws for invalid format', () => {
    expect(() => AssetId('ETH')).toThrow(TypeError)
  })

  it('can represent ETH-9', () => {
    expect(() => AssetId('ETH-9')).not.toThrow()
  })

  it('can represent BTC-10', () => {
    expect(() => AssetId('BTC-10')).not.toThrow()
  })

  it('can represent 1INCH-9', () => {
    expect(() => AssetId('1INCH-9')).not.toThrow()
  })

  describe(AssetId.decimals.name, () => {
    it('returns 9 for ETH-9', () => {
      expect(AssetId.decimals(AssetId('ETH-9'))).toEqual(9)
    })

    it('returns 10 for ETH-10', () => {
      expect(AssetId.decimals(AssetId('ETH-10'))).toEqual(10)
    })
  })
})
