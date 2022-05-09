import { AssetId, StarkKey } from '@explorer/types'

import { ControllerCreatedResult } from '../../../src/api/controllers/ControllerResult'
import { OfferController } from '../../../src/api/controllers/OfferController'
import { createOffersRouter } from '../../../src/api/routers/OfferRouter'
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

const acceptedOffer = {
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

describe('OfferRouter', () => {
  const router = createOffersRouter(
    mock<OfferController>({ postOffer: async () => CREATED_RESULT })
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
})
