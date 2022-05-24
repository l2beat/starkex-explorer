import { AssetId, StarkKey } from '@explorer/types'
import { expect } from 'earljs'

import { CreateOfferBody, serializeCreateOfferBody } from '../src'

describe('CreateOfferBody', () => {
  it('can be serialized and deserialized', () => {
    const body: CreateOfferBody = {
      offer: {
        aIsBuyingSynthetic: true,
        amountCollateral: 123n,
        amountSynthetic: 456n,
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
