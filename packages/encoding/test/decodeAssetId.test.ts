import { expect } from 'chai'

import { decodeAssetId } from '../src/decodeAssetId'
import { DecodingError } from '../src/DecodingError'

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
