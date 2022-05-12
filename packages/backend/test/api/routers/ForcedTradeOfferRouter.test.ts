import {
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { SuperAgentTest } from 'supertest'

import { ForcedTradeOfferController } from '../../../src/api/controllers/ForcedTradeOfferController'
import { createForcedTradeOfferRouter } from '../../../src/api/routers/ForcedTradeOfferRouter'
import { ForcedTradeOfferRepository } from '../../../src/peripherals/database/ForcedTradeOfferRepository'
import { StateUpdateRepository } from '../../../src/peripherals/database/StateUpdateRepository'
import { UserRegistrationEventRepository } from '../../../src/peripherals/database/UserRegistrationEventRepository'
import { Logger } from '../../../src/tools/Logger'
import { mock } from '../../mock'
import { setupDatabaseTestSuite } from '../../peripherals/database/setup'
import { createTestApiServer } from '../TestApiServer'

const starkKeyA = StarkKey(
  '05733b2b5e71223285e7966386a4e81d3c55480782af122227cf7d1b0b08c32e'
)
const starkKeyB = StarkKey(
  '069913f789acdd07ff1aff8aa5dcf3d4935cf1d8b29d0f41839cd1be52dc4a41'
)
const rootHash = PedersenHash.fake()

const userRegistrationEvent = {
  blockNumber: 1_000,
  ethAddress: EthereumAddress('0xCE9a3e51B905997F1D098345a92B6c749A1f72B9'),
  starkKey: starkKeyB,
}

const initialOffer = {
  starkKeyA: starkKeyA,
  positionIdA: 0n.toString(),
  syntheticAssetId: AssetId('ETH-9').toString(),
  amountCollateral: 2000n.toString(),
  amountSynthetic: 1n.toString(),
  aIsBuyingSynthetic: true,
}

const initialOfferInvalidPosition = {
  starkKeyA: starkKeyA,
  positionIdA: 1n.toString(),
  syntheticAssetId: AssetId('ETH-9').toString(),
  amountCollateral: 2000n.toString(),
  amountSynthetic: 1n.toString(),
  aIsBuyingSynthetic: true,
}

const initialOfferInvalidAmount = {
  starkKeyA: starkKeyA,
  positionIdA: 0n.toString(),
  syntheticAssetId: AssetId('ETH-9').toString(),
  amountCollateral: 4000n.toString(),
  amountSynthetic: 2n.toString(),
  aIsBuyingSynthetic: true,
}

const stateUpdate = {
  stateUpdate: {
    id: 0,
    blockNumber: 10_000,
    rootHash,
    factHash: Hash256.fake(),
    timestamp: Timestamp(0),
  },
  positions: [
    {
      publicKey: starkKeyA,
      positionId: 0n,
      collateralBalance: 2000n,
      balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
    },
  ],
  prices: [{ assetId: AssetId('ETH-9'), price: 40n }],
}

describe('OfferRouter', () => {
  const { knex } = setupDatabaseTestSuite()
  let server: SuperAgentTest

  describe('/offer', () => {
    let offerRepository: ForcedTradeOfferRepository
    let stateUpdateRepository: StateUpdateRepository

    before(async () => {
      offerRepository = new ForcedTradeOfferRepository(knex, Logger.SILENT)
      stateUpdateRepository = new StateUpdateRepository(knex, Logger.SILENT)
      const userRegistrationEventRepository =
        mock<UserRegistrationEventRepository>()

      await stateUpdateRepository.add(stateUpdate)

      const offerController = new ForcedTradeOfferController(
        offerRepository,
        stateUpdateRepository,
        userRegistrationEventRepository
      )
      const router = createForcedTradeOfferRouter(offerController)
      server = createTestApiServer([router])
    })

    afterEach(async () => {
      offerRepository.deleteAll()
    })

    after(async () => {
      stateUpdateRepository.deleteAll()
    })

    it('returnes created', async () => {
      await server.post('/offer').send(initialOffer).expect(201, { id: 1 })
    })

    it('returnes not found when position does not exist', async () => {
      await server.post('/offer').send(initialOfferInvalidPosition).expect(404)
    })

    it('returnes bad request when position does not have enough assets', async () => {
      await server.post('/offer').send(initialOfferInvalidAmount).expect(400)
    })

    it('returnes bad request when assets are already offered', async () => {
      await server.post('/offer').send(initialOffer).expect(201)
      await server.post('/offer').send(initialOffer).expect(400)
    })
  })

  describe('/offer/:initialOfferId', () => {
    let offerRepository: ForcedTradeOfferRepository
    let id: number

    before(async () => {
      offerRepository = new ForcedTradeOfferRepository(knex, Logger.SILENT)
      const stateUpdateRepository = new StateUpdateRepository(
        knex,
        Logger.SILENT
      )
      const userRegistrationEventRepository =
        new UserRegistrationEventRepository(knex, Logger.SILENT)

      await stateUpdateRepository.add({
        stateUpdate: {
          id: 0,
          blockNumber: 10_000,
          rootHash,
          factHash: Hash256.fake(),
          timestamp: Timestamp(0),
        },
        positions: [
          {
            publicKey: starkKeyA,
            positionId: 517n,
            collateralBalance: 28000000000n,
            balances: [],
          },
          {
            publicKey: starkKeyB,
            positionId: 718n,
            collateralBalance: 0n,
            balances: [{ assetId: AssetId('AAVE-8'), balance: 1000000n }],
          },
        ],
        prices: [{ assetId: AssetId('AAVE-8'), price: 40n }],
      })

      await userRegistrationEventRepository.add([userRegistrationEvent])

      const offerController = new ForcedTradeOfferController(
        offerRepository,
        stateUpdateRepository,
        userRegistrationEventRepository
      )
      const router = createForcedTradeOfferRouter(offerController)
      server = createTestApiServer([router])
    })

    beforeEach(async () => {
      id = await offerRepository.addInitialOffer({
        createdAt: Timestamp(Date.now()),
        starkKeyA: starkKeyA,
        positionIdA: 517n,
        syntheticAssetId: AssetId('AAVE-8'),
        amountCollateral: 28000000000n,
        amountSynthetic: 1000000n,
        aIsBuyingSynthetic: true,
      })
    })

    afterEach(async () => {
      offerRepository.deleteAll()
    })

    it('returnes success', async () => {
      await server
        .put(`/offer/${id}`)
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

    it('returnes bad request when offer already accepted', async () => {
      await server.put(`/offer/${id}`).send({
        starkKeyB: starkKeyB.toString(),
        positionIdB: 718n.toString(),
        submissionExpirationTime: '3456000000000',
        nonce: 38404830n.toString(),
        premiumCost: true,
        signature:
          '0x1bb089c2686c65d8d2e5800761b2826e0fc1f68f7e228fc161384958222bbc271458f40ed77507d59ca77c56204b0134b429eaface39b196d1f07e917a14c7641b',
      })

      await server
        .put(`/offer/${id}`)
        .send({
          starkKeyB: starkKeyB.toString(),
          positionIdB: 718n.toString(),
          submissionExpirationTime: '3456000000000',
          nonce: 38404830n.toString(),
          premiumCost: true,
          signature:
            '0x1bb089c2686c65d8d2e5800761b2826e0fc1f68f7e228fc161384958222bbc271458f40ed77507d59ca77c56204b0134b429eaface39b196d1f07e917a14c7641b',
        })
        .expect(400, 'Offer already accepted by a user.')
    })

    it('returnes bad request when signature invalid', async () => {
      await server
        .put(`/offer/${id}`)
        .send({
          starkKeyB: starkKeyB.toString(),
          positionIdB: 718n.toString(),
          submissionExpirationTime: '3456000000000',
          nonce: 38404830n.toString(),
          premiumCost: true,
          signature: '0x0',
        })
        .expect(400, 'Your offer is invalid.')
    })
  })
})
