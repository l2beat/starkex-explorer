import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { assetTotalUSDCents } from '../../src/core/AssetTotalCalculator'

describe(assetTotalUSDCents.name, () => {
  it('caculates value properly', () => {
    const cases = [
      {
        balance: 1000n,
        price: 22042658710n,
        assetId: 'BTC-10',
        total: 51322064152n,
      },
      {
        balance: 1000n,
        price: 7611149047n,
        assetId: 'ETH-9',
        total: 1772108731n,
      },
    ]
    cases.forEach(({ balance, price, assetId, total }) => {
      expect(assetTotalUSDCents(balance, price, AssetId(assetId))).toEqual(
        total
      )
    })
  })
})
