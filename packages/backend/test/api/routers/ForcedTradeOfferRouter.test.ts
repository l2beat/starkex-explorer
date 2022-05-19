import { AssetId, StarkKey } from '@explorer/types'

import { ForcedTradeOfferController } from '../../../src/api/controllers/ForcedTradeOfferController'
import { createForcedTradeOfferRouter } from '../../../src/api/routers/ForcedTradeOfferRouter'
import { mock } from '../../mock'
import { createTestApiServer } from '../TestApiServer'

const starkKeyA = StarkKey(
  '05733b2b5e71223285e7966386a4e81d3c55480782af122227cf7d1b0b08c32e'
)
const starkKeyB = StarkKey(
  '069913f789acdd07ff1aff8aa5dcf3d4935cf1d8b29d0f41839cd1be52dc4a41'
)

const validInitialOffer = {
  starkKeyA: starkKeyA,
  positionIdA: 0n.toString(),
  syntheticAssetId: AssetId('ETH-9').toString(),
  amountCollateral: 2000n.toString(),
  amountSynthetic: 1n.toString(),
  aIsBuyingSynthetic: true,
}

describe('OfferRouter', () => {
  const offerController = mock<ForcedTradeOfferController>({
    postOffer: async () => ({ type: 'created', content: { id: 1 } }),
    acceptOffer: async (id) =>
      id === 1
        ? {
            type: 'success',
            content: 'Accept offer was submitted.',
          }
        : { type: 'not found', content: 'Offer does not exist.' },
  })
  const router = createForcedTradeOfferRouter(offerController)
  const server = createTestApiServer([router])

  describe('/forced/offers', () => {
    it('returns created', async () => {
      await server
        .post('/forced/offers')
        .send({ offer: validInitialOffer, signature: '0x' })
        .expect(201, { id: 1 })
    })
  })

  describe('/forced/offers/:initialOfferId', () => {
    it('returns success', async () => {
      await server
        .put(`/forced/offers/1`)
        .send({
          starkKeyB: starkKeyB.toString(),
          positionIdB: 718n.toString(),
          submissionExpirationTime: '3456000000000',
          nonce: 38404830n.toString(),
          premiumCost: true,
          signature:
            '0x1bb089c2686c65d8d2e5800761b2826e0fc1f68f7e228fc161384958222bbc271458f40ed77507d59ca77c56204b0134b429eaface39b196d1f07e917a14c7641b',
        })
        .expect(200)
    })
    it('returns not found when offer id invalid', async () => {
      await server
        .put(`/forced/offers/2`)
        .send({
          starkKeyB: starkKeyB.toString(),
          positionIdB: 718n.toString(),
          submissionExpirationTime: '3456000000000',
          nonce: 38404830n.toString(),
          premiumCost: true,
          signature:
            '0x1bb089c2686c65d8d2e5800761b2826e0fc1f68f7e228fc161384958222bbc271458f40ed77507d59ca77c56204b0134b429eaface39b196d1f07e917a14c7641b',
        })
        .expect(404)
    })
  })
})
