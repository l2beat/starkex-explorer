import { expect } from 'chai'

import { decodeAssetId, encodeAssetId } from '../src/assetId'
import { DecodingError } from '../src/DecodingError'

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

describe('decodeAssetId', () => {
  it('fails for non-15 byte strings', () => {
    expect(() => decodeAssetId('112233')).to.throw(
      DecodingError,
      'Invalid AssetId length'
    )
  })

  it('can decode BTC-10', () => {
    const result = decodeAssetId('4254432d3130000000000000000000')
    expect(result).to.equal('BTC-10')
  })
})
