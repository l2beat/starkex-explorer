import { AssetId, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { toSignableCreateOffer } from '../src'

const offer = {
  starkKeyA: StarkKey.fake(),
  positionIdA: 1n,
  syntheticAssetId: AssetId('BTC-10'),
  collateralAmount: 2n,
  syntheticAmount: 3n,
  aIsBuyingSynthetic: true,
}

describe(toSignableCreateOffer.name, () => {
  it('works properly', () => {
    expect(toSignableCreateOffer(offer)).toEqual(
      [
        '{',
        `  "starkKeyA": "${offer.starkKeyA}",`,
        '  "positionIdA": "1",',
        '  "syntheticAssetId": "BTC-10",',
        '  "collateralAmount": "2",',
        '  "syntheticAmount": "3",',
        '  "aIsBuyingSynthetic": true',
        '}',
      ].join('\n')
    )
  })
})
