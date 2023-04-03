import { AssetId } from '@explorer/types'
import { expect } from 'earl'

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
    const result = decodeAssetId('4554482d3900000000000000000000')
    expect(result).toEqual(AssetId('ETH-9'))
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
