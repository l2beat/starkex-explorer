import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { decodeAssetId } from './decodeAssetId'
import { DecodingError } from './DecodingError'

const collateralAssetId = AssetId('USDC-6')

describe('decodeAssetId', () => {
  it('fails for non-15 byte strings', () => {
    expect(() => decodeAssetId('112233', collateralAssetId)).toThrow(
      DecodingError,
      'Invalid AssetId length'
    )
  })

  it('can decode BTC-10', () => {
    const result = decodeAssetId(
      '4254432d3130000000000000000000',
      collateralAssetId
    )
    expect(result).toEqual(AssetId('BTC-10'))
  })

  it('can decode USDC-6', () => {
    const result = decodeAssetId(
      '02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d',
      collateralAssetId
    )
    expect(result).toEqual(AssetId('USDC-6'))
  })

  it('can decode BigNumbers', () => {
    const bigNumber = {
      toHexString() {
        return '0x4254432d3130000000000000000000'
      },
    }
    expect(decodeAssetId(bigNumber, collateralAssetId)).toEqual(
      AssetId('BTC-10')
    )
  })
})
