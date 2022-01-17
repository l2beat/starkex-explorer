import { expect } from 'chai'

import { encodeAssetId } from '../src/encodeAssetId'

describe('encodeAssetId', () => {
  it('fails for too long strings', () => {
    expect(() => encodeAssetId('0123456789abcdef')).to.throw('AssetId too long')
  })

  it('fails for non-ascii characters', () => {
    expect(() => encodeAssetId('abc\u1234')).to.throw(
      'AssetId contains invalid characters'
    )
  })

  it('can encode BTC-10', () => {
    const result = encodeAssetId('BTC-10')
    expect(result).to.equal('4254432d3130000000000000000000')
  })
})
