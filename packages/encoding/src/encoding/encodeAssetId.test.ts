import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { encodeAssetId } from './encodeAssetId'

describe('encodeAssetId', () => {
  it('can encode BTC-10', () => {
    const result = encodeAssetId(AssetId('BTC-10'))
    expect(result).toEqual('4254432d3130000000000000000000')
  })
  it('can encode ETH-9', () => {
    const result = encodeAssetId(AssetId('ETH-9'))
    expect(result).toEqual('4554482d3900000000000000000000')
  })
})
