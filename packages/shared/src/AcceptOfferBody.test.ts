import { StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { AcceptOfferBody, serializeAcceptOfferBody } from './AcceptOfferBody'

describe('AcceptOfferBody', () => {
  it('can be serialized and deserialized', () => {
    const body: AcceptOfferBody = {
      nonce: 1n,
      positionIdB: 2n,
      premiumCost: false,
      signature: '0x1234567890abcdef',
      starkKeyB: StarkKey.fake(),
      submissionExpirationTime: Timestamp(3n),
    }
    const serialized = serializeAcceptOfferBody(body)
    expect(serialized).toBeA(String)
    const deserialized = AcceptOfferBody.parse(JSON.parse(serialized))
    expect(deserialized).toEqual(body)
  })
})
