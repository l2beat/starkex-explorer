import { AssetId } from '@explorer/types'
import { expect } from 'earljs'

import { getTradeOfferPriceUSDCents } from '../../src/core/getTradeOfferPriceUSDCents'

describe(getTradeOfferPriceUSDCents.name, () => {
  const cases = [
    {
      collateralAmount: 3000_000000n,
      syntheticAmount: 1_000000000n,
      assetId: AssetId('ETH-9'),
      expected: 3000_00n,
    },
    {
      collateralAmount: 6000_000000n,
      syntheticAmount: 5_00000000n,
      assetId: AssetId('AAVE-8'),
      expected: 1200_00n,
    },
    {
      collateralAmount: 6000_000000n,
      syntheticAmount: 10_000000n,
      assetId: AssetId('ADA-6'),
      expected: 600_00n,
    },
  ]

  cases.forEach(({ collateralAmount, syntheticAmount, assetId, expected }) => {
    it(`calculates ${assetId} price properly`, () => {
      expect(
        getTradeOfferPriceUSDCents(collateralAmount, assetId, syntheticAmount)
      ).toEqual(expected)
    })
  })
})
