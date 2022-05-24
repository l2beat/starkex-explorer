import { AssetId, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { getCreateRequest } from '../src'

const offer = {
  starkKeyA: StarkKey.fake(),
  positionIdA: 1n,
  syntheticAssetId: AssetId('BTC-10'),
  amountCollateral: 2n,
  amountSynthetic: 3n,
  aIsBuyingSynthetic: true,
}

describe(getCreateRequest.name, () => {
  it('works properly', () => {
    expect(getCreateRequest(offer)).toEqual(
      [
        '{',
        `  "starkKeyA": "${offer.starkKeyA}",`,
        '  "positionIdA": "1",',
        '  "syntheticAssetId": "BTC-10",',
        '  "amountCollateral": "2",',
        '  "amountSynthetic": "3",',
        '  "aIsBuyingSynthetic": true',
        '}',
      ].join('\n')
    )
  })
})
