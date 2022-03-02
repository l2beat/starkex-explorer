import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { encodeAssetId } from '../src/encodeAssetId'

describe('encodeAssetId', () => {
  it('can encode BTC-10', () => {
    const result = encodeAssetId(AssetId('BTC-10'))
    expect(result).toEqual('4254432d3130000000000000000000')
  })
})
