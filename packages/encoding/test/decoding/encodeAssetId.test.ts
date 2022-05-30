import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { DYDX_INTERNAL_USDC_ID_ENDODED } from '../../src/constants'
import { encodeAssetId } from '../../src/encoding/encodeAssetId'

describe('encodeAssetId', () => {
  it('can encode BTC-10', () => {
    const result = encodeAssetId(AssetId('BTC-10'))
    expect(result).toEqual('4254432d3130000000000000000000')
  })
  it('can encode USDC-6', () => {
    const result = encodeAssetId(AssetId.USDC)
    expect(result).toEqual(DYDX_INTERNAL_USDC_ID_ENDODED)
  })
})
