import { expect } from 'earljs'

import { encodeAssetId } from '../src/encodeAssetId'

describe('encodeAssetId', () => {
  it('fails for too long strings', () => {
    expect(() => encodeAssetId('0123456789abcdef')).toThrow('AssetId too long')
  })

  it('fails for non-ascii characters', () => {
    expect(() => encodeAssetId('abc\u1234')).toThrow(
      'AssetId contains invalid characters'
    )
  })

  it('can encode BTC-10', () => {
    const result = encodeAssetId('BTC-10')
    expect(result).toEqual('4254432d3130000000000000000000')
  })
})
