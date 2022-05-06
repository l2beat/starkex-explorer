import { AssetId, StarkKey } from '@explorer/types'

import { ControllerCreatedResult } from '../../../src/api/controllers/ControllerResult'
import { OfferController } from '../../../src/api/controllers/OfferController'
import { createOffersRouter } from '../../../src/api/routers/OffersRouter'
import { mock } from '../../mock'
import { createTestApiServer } from '../TestApiServer'

const record1 = {
  starkKeyA: StarkKey.fake().toString(),
  positionIdA: 1n.toString(),
  syntheticAssetId: AssetId('ETH-18').toString(),
  amountCollateral: 20n.toString(),
  amountSynthetic: 1000n.toString(),
  aIsBuyingSynthetic: true,
}

const CREATED_RESULT: ControllerCreatedResult = {
  type: 'created',
}

describe('OfferRouter', () => {
  describe('/offer', async () => {
    it('returnes success', async () => {
      const router = createOffersRouter(
        mock<OfferController>({
          postOffer: async () => CREATED_RESULT,
        })
      )

      const server = createTestApiServer([router])

      await server.post('/offer').send(record1).expect(201)
    })
  })
})
