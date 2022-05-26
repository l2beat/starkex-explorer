import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { DYDX_INTERNAL_USDC_ID_ENDODED } from '../../src/constants'
import { decodeAssetId } from '../../src/decoding/decodeAssetId'
import { DecodingError } from '../../src/decoding/DecodingError'

describe('decodeAssetId', () => {
  it('fails for non-15 byte strings', () => {
    expect(() => decodeAssetId('112233')).toThrow(
      DecodingError,
      'Invalid AssetId length'
    )
  })

  it('can decode BTC-10', () => {
    const result = decodeAssetId('4254432d3130000000000000000000')
    expect(result).toEqual(AssetId('BTC-10'))
  })

  it('can decode USDC-6', () => {
    const result = decodeAssetId(DYDX_INTERNAL_USDC_ID_ENDODED)
    expect(result).toEqual(AssetId.USDC)
  })
})
