import { AssetId, StarkKey } from '@explorer/types'

import {
  ControllerCreatedResult,
  ControllerSuccessResult,
} from '../../../src/api/controllers/ControllerResult'
import { ForceTradeOfferController } from '../../../src/api/controllers/ForceTradeOfferController'
import { createForceTradeOfferRouter } from '../../../src/api/routers/ForceTradeOfferRouter'
import { mock } from '../../mock'
import { createTestApiServer } from '../TestApiServer'

const offer = {
  starkKeyA: StarkKey.fake().toString(),
  positionIdA: 1n.toString(),
  syntheticAssetId: AssetId('ETH-18').toString(),
  amountCollateral: 20n.toString(),
  amountSynthetic: 1000n.toString(),
  aIsBuyingSynthetic: true,
}

const acceptOffer = {
  starkKeyB: StarkKey.fake().toString(),
  positionIdB: 2n.toString(),
  submissionExpirationTime: '100000', // Timestamp?
  nonce: 1n.toString(),
  premiumCost: false,
  signature: '0x',
}

const CREATED_RESULT: ControllerCreatedResult = {
  type: 'created',
  content: { id: 1 },
}

const SUCCESS_RESULT: ControllerSuccessResult = {
  type: 'success',
  content: 'Accept offer was submitted',
}

describe('OfferRouter', () => {
  const router = createForceTradeOfferRouter(
    mock<ForceTradeOfferController>({
      postOffer: async () => CREATED_RESULT,
      acceptOffer: async () => SUCCESS_RESULT,
    })
  )
  const server = createTestApiServer([router])
  describe('/offer', () => {
    it('returnes created', async () => {
      await server
        .post('/offer')
        .send(offer)
        .expect(201, CREATED_RESULT.content)
    })
  })

  describe('/offer/:initialOfferId/accept', () => {
    it('returnes success', async () => {
      await server.post('/offer/1/accept').send(acceptOffer).expect(200)
    })
  })
})
