import { AssetId, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { mockObject } from 'earl'

import { fakeBigInt, fakeBoolean, fakeInt } from '../../test/fakes'
import { createTestApiServer } from '../../test/TestApiServer'
import { ForcedTradeOfferController } from '../controllers/ForcedTradeOfferController'
import { TransactionSubmitController } from '../controllers/TransactionSubmitController'
import { createTransactionRouter } from './ForcedTransactionRouter'

const signature = '0x12345'
const initialData = {
  offer: {
    starkKeyA: StarkKey.fake(),
    positionIdA: 0n.toString(),
    syntheticAssetId: AssetId('ETH-9').toString(),
    collateralAmount: 2000n.toString(),
    syntheticAmount: 1n.toString(),
    isABuyingSynthetic: true,
  },
  signature,
}
const acceptedData = {
  starkKeyB: StarkKey.fake(),
  positionIdB: fakeBigInt().toString(),
  submissionExpirationTime: Timestamp(fakeInt()).toString(),
  nonce: fakeBigInt().toString(),
  premiumCost: fakeBoolean(),
  signature,
}

function createServer(...params: Parameters<typeof createTransactionRouter>) {
  const router = createTransactionRouter(...params)
  return createTestApiServer([router])
}

describe('ForcedTransactionRouter', () => {
  describe('/forced/offers', () => {
    it('returns created', async () => {
      const id = 1
      await createServer(
        mockObject<ForcedTradeOfferController>({
          postOffer: async () => ({ type: 'created', content: { id } }),
        }),
        mockObject<TransactionSubmitController>()
      )
        .post('/forced/offers')
        .send(initialData)
        .expect(201, { id })
    })
  })

  describe('/forced/offers/:offerId/accept', () => {
    it('returns success', async () => {
      await createServer(
        mockObject<ForcedTradeOfferController>({
          acceptOffer: async () => ({
            type: 'success',
            content: 'Accept offer was submitted.',
          }),
        }),
        mockObject<TransactionSubmitController>()
      )
        .post('/forced/offers/1/accept')
        .send(acceptedData)
        .expect(200)
    })
    it('returns not found when offer not found', async () => {
      await createServer(
        mockObject<ForcedTradeOfferController>({
          acceptOffer: async () => ({
            type: 'not found',
            message: 'Offer does not exist.',
          }),
        }),
        mockObject<TransactionSubmitController>()
      )
        .post('/forced/offers/1/accept')
        .send(acceptedData)
        .expect(404)
    })
  })

  describe('/forced/offers/:initialOfferId', () => {
    it('returns success', async () => {
      await createServer(
        mockObject<ForcedTradeOfferController>({
          cancelOffer: async () => ({
            type: 'success',
            content: 'Offer cancelled.',
          }),
        }),
        mockObject<TransactionSubmitController>()
      )
        .post('/forced/offers/1/cancel')
        .send({ signature })
        .expect(200)
    })

    it('returns bad request for invalid input', async () => {
      await createServer(
        mockObject<ForcedTradeOfferController>(),
        mockObject<TransactionSubmitController>()
      )
        .post('/forced/offers/1/cancel')
        .send({
          signature: 123,
        })
        .expect(400)
    })
  })

  describe('POST /forced/exits', () => {
    it('returns success', async () => {
      const hash = Hash256.fake()
      await createServer(
        mockObject<ForcedTradeOfferController>(),
        mockObject<TransactionSubmitController>({
          submitForcedExit: async () => ({
            type: 'created',
            content: { id: hash },
          }),
        })
      )
        .post('/forced/exits')
        .send({ hash })
        .expect(201)
    })

    describe('POST /forced/exits/finalize', () => {
      it('returns success', async () => {
        const exitHash = Hash256.fake()
        const finalizeHash = Hash256.fake()
        await createServer(
          mockObject<ForcedTradeOfferController>(),
          mockObject<TransactionSubmitController>({
            submitWithdrawal: async () => ({
              type: 'created',
              content: { id: finalizeHash },
            }),
          })
        )
          .post('/forced/exits/finalize')
          .send({ exitHash, finalizeHash })
          .expect(201)
      })
    })

    it('returns bad request for invalid input', async () => {
      await createServer(
        mockObject<ForcedTradeOfferController>(),
        mockObject<TransactionSubmitController>()
      )
        .post('/forced/exits')
        .send({ hash: 123 })
        .expect(400)
    })
  })
})
