import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { getTradeOfferPriceUSDCents } from '../../src/core/getTradeOfferPriceUSDCents'

describe(getTradeOfferPriceUSDCents.name, () => {
  const cases = [
    {
      amountCollateral: 3000_000000n,
      amountSynthetic: 1_000000000n,
      assetId: AssetId('ETH-9'),
      expected: 3000_00n,
    },
    {
      amountCollateral: 6000_000000n,
      amountSynthetic: 5_00000000n,
      assetId: AssetId('AAVE-8'),
      expected: 1200_00n,
    },
    {
      amountCollateral: 6000_000000n,
      amountSynthetic: 10_000000n,
      assetId: AssetId('ADA-6'),
      expected: 600_00n,
    },
  ]

  cases.forEach(({ amountCollateral, amountSynthetic, assetId, expected }) => {
    it(`calculates ${assetId} price properly`, () => {
      expect(
        getTradeOfferPriceUSDCents(amountCollateral, assetId, amountSynthetic)
      ).toEqual(expected)
    })
  })
})
