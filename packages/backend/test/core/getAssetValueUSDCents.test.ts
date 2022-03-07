import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { getAssetValueUSDCents } from '../../src/core/getAssetValueUSDCents'

describe(getAssetValueUSDCents.name, () => {
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
    it('calculates value properly', () => {
      expect(getAssetValueUSDCents(balance, price, AssetId(assetId))).toEqual(
        total
      )
    })
  })
})
