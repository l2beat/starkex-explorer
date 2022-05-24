import { AssetId, StarkKey } from '@explorer/types'

import { ForcedTradeOfferController } from '../../../src/api/controllers/ForcedTradeOfferController'
import { createForcedTradeOfferRouter } from '../../../src/api/routers/ForcedTradeOfferRouter'
import { fakeBigInt, fakeBoolean, fakeInt } from '../../fakes'
import { mock } from '../../mock'
import { createTestApiServer } from '../TestApiServer'

const signature = '0x12345'
const initialData = {
  offer: {
    starkKeyA: StarkKey.fake(),
    positionIdA: 0n.toString(),
    syntheticAssetId: AssetId('ETH-9').toString(),
    amountCollateral: 2000n.toString(),
    amountSynthetic: 1n.toString(),
    aIsBuyingSynthetic: true,
  },
  signature,
}
const acceptedData = {
  starkKeyB: StarkKey.fake(),
  positionIdB: fakeBigInt().toString(),
  submissionExpirationTime: fakeInt().toString(),
  nonce: fakeBigInt().toString(),
  premiumCost: fakeBoolean(),
  signature,
}

function createServer(overrides?: Partial<ForcedTradeOfferController>) {
  const offerController = mock<ForcedTradeOfferController>(overrides)
  const router = createForcedTradeOfferRouter(offerController)
  return createTestApiServer([router])
}

describe('ForcedTradeOfferRouter', () => {
  describe('/forced/offers', () => {
    it('returns created', async () => {
      const id = 1
      await createServer({
        postOffer: async () => ({ type: 'created', content: { id } }),
      })
        .post('/forced/offers')
        .send(initialData)
        .expect(201, { id })
    })
  })

  describe('/forced/offers/:initialOfferId', () => {
    it('returns success', async () => {
      await createServer({
        acceptOffer: async () => ({
          type: 'success',
          content: 'Accept offer was submitted.',
        }),
      })
        .put('/forced/offers/1')
        .send(acceptedData)
        .expect(200)
    })
    it('returns not found when offer not found', async () => {
      await createServer({
        acceptOffer: async () => ({
          type: 'not found',
          content: 'Offer does not exist.',
        }),
      })
        .put('/forced/offers/1')
        .send(acceptedData)
        .expect(404)
    })
  })

  describe('/forced/offers/:initialOfferId', () => {
    it('returns success', async () => {
      await createServer({
        cancelOffer: async () => ({
          type: 'success',
          content: 'Offer cancelled.',
        }),
      })
        .post('/forced/offers/1/cancel')
        .send({ signature })
        .expect(200)
    })
    it('returns bad request for invalid input', async () => {
      await createServer()
        .post('/forced/offers/1/cancel')
        .send({
          signature: 123,
        })
        .expect(400)
    })
  })
})
