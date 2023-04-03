import { AssetId, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import { CreateOfferBody, serializeCreateOfferBody } from './CreateOfferBody'

describe('CreateOfferBody', () => {
  it('can be serialized and deserialized', () => {
    const body: CreateOfferBody = {
      offer: {
        isABuyingSynthetic: true,
        collateralAmount: 123n,
        syntheticAmount: 456n,
        positionIdA: 789n,
        starkKeyA: StarkKey.fake(),
        syntheticAssetId: AssetId('ABC-6'),
      },
      signature: '0x1234567890abcdef',
    }
    const serialized = serializeCreateOfferBody(body)
    expect(serialized).toBeA(String)
    const deserialized = CreateOfferBody.parse(JSON.parse(serialized))
    expect(deserialized).toEqual(body)
  })
})
