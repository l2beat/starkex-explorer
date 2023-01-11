import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { DYDX_INTERNAL_USDC_ID_ENCODED } from '../constants'
import { decodeAssetId } from './decodeAssetId'
import { DecodingError } from './DecodingError'

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
    const result = decodeAssetId(DYDX_INTERNAL_USDC_ID_ENCODED)
    expect(result).toEqual(AssetId.USDC)
  })

  it('can decode BigNumbers', () => {
    const bigNumber = {
      toHexString() {
        return '0x4254432d3130000000000000000000'
      },
    }
    expect(decodeAssetId(bigNumber)).toEqual(AssetId('BTC-10'))
  })
})
