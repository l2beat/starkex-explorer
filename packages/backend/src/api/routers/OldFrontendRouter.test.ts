import {
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { mockObject } from 'earl'
import { SuperAgentTest } from 'supertest'

import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { setupDatabaseTestSuite } from '../../test/database'
import { createTestApiServer } from '../../test/TestApiServer'
import { Logger } from '../../tools/Logger'
import { ControllerSuccessResult } from '../controllers/ControllerResult'
import { ForcedTransactionController } from '../controllers/ForcedTransactionController'
import { OldForcedTradeOfferController } from '../controllers/OldForcedTradeOfferController'
import { OldHomeController } from '../controllers/OldHomeController'
import { OldSearchController } from '../controllers/OldSearchController'
import { OldStateUpdateController } from '../controllers/OldStateUpdateController'
import { PositionController } from '../controllers/PositionController'
import { createOldFrontendRouter } from './OldFrontendRouter'

const TEST_PAGE = '<!DOCTYPE html><p>test page</p>'
const SUCCESS_RESULT: ControllerSuccessResult = {
  type: 'success',
  content: TEST_PAGE,
}

describe('FrontendRouter', () => {
  describe('/', () => {
    it('returns html', async () => {
      const frontendRouter = createOldFrontendRouter(
        mockObject<PositionController>(),
        mockObject<OldHomeController>({
          getHomePage: async () => SUCCESS_RESULT,
        }),
        mockObject<OldForcedTradeOfferController>(),
        mockObject<ForcedTransactionController>(),
        mockObject<OldStateUpdateController>(),
        mockObject<OldSearchController>()
      )
      const server = createTestApiServer([frontendRouter])

      await server.get('/').expect(200).expect(TEST_PAGE)
    })
  })

  describe('/state-updates', () => {
    const frontendRouter = createOldFrontendRouter(
      mockObject<PositionController>(),
      mockObject<OldHomeController>(),
      mockObject<OldForcedTradeOfferController>(),
      mockObject<ForcedTransactionController>(),
      mockObject<OldStateUpdateController>({
        getStateUpdatesPage: async () => SUCCESS_RESULT,
      }),
      mockObject<OldSearchController>()
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get('/state-updates').expect(200).expect(TEST_PAGE)
    })

    it('accepts pagination params', async () => {
      await server
        .get('/state-updates?page=123&perPage=100')
        .expect(200)
        .expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/state-updates?page=foo&perPage=bar').expect(400)
    })
  })

  describe('/state-updates/:id', () => {
    const frontendRouter = createOldFrontendRouter(
      mockObject<PositionController>(),
      mockObject<OldHomeController>(),
      mockObject<OldForcedTradeOfferController>(),
      mockObject<ForcedTransactionController>(),
      mockObject<OldStateUpdateController>({
        getStateUpdateDetailsPage: async () => SUCCESS_RESULT,
      }),
      mockObject<OldSearchController>()
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get('/state-updates/1').expect(200).expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/state-updates/foo').expect(400)
    })
  })

  describe('/positions/:positionId', () => {
    const frontendRouter = createOldFrontendRouter(
      mockObject<PositionController>({
        getPositionDetailsPage: async () => SUCCESS_RESULT,
      }),
      mockObject<OldHomeController>(),
      mockObject<OldForcedTradeOfferController>(),
      mockObject<ForcedTransactionController>(),
      mockObject<OldStateUpdateController>(),
      mockObject<OldSearchController>()
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get('/positions/1').expect(200).expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/positions/foo').expect(400)
    })
  })

  describe('/positions/:positionId/updates/:updateId', () => {
    const frontendRouter = createOldFrontendRouter(
      mockObject<PositionController>({
        getPositionUpdatePage: async () => SUCCESS_RESULT,
      }),
      mockObject<OldHomeController>(),
      mockObject<OldForcedTradeOfferController>(),
      mockObject<ForcedTransactionController>(),
      mockObject<OldStateUpdateController>(),
      mockObject<OldSearchController>()
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get('/positions/1/updates/1').expect(200).expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/positions/foo/updates/bar').expect(400)
    })
  })

  describe('/forced', () => {
    const frontendRouter = createOldFrontendRouter(
      mockObject<PositionController>(),
      mockObject<OldHomeController>(),
      mockObject<OldForcedTradeOfferController>(),
      mockObject<ForcedTransactionController>({
        getForcedTransactionsPage: async () => SUCCESS_RESULT,
      }),
      mockObject<OldStateUpdateController>(),
      mockObject<OldSearchController>()
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get('/forced').expect(200).expect(TEST_PAGE)
    })

    it('accepts pagination params', async () => {
      await server
        .get('/forced?page=123&perPage=100')
        .expect(200)
        .expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/forced?page=foo&perPage=bar').expect(400)
    })
  })

  describe('/forced/offers', () => {
    const frontendRouter = createOldFrontendRouter(
      mockObject<PositionController>(),
      mockObject<OldHomeController>(),
      mockObject<OldForcedTradeOfferController>({
        getOffersIndexPage: async () => SUCCESS_RESULT,
      }),
      mockObject<ForcedTransactionController>(),
      mockObject<OldStateUpdateController>(),
      mockObject<OldSearchController>()
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get(`/forced/offers`).expect(200).expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/forced/offers?page=0').expect(400)
      await server.get('/forced/offers?page=-1').expect(400)
    })
  })

  describe('/forced/:hash', () => {
    const frontendRouter = createOldFrontendRouter(
      mockObject<PositionController>(),
      mockObject<OldHomeController>(),
      mockObject<OldForcedTradeOfferController>(),
      mockObject<ForcedTransactionController>({
        getForcedTransactionDetailsPage: async () => SUCCESS_RESULT,
      }),
      mockObject<OldStateUpdateController>(),
      mockObject<OldSearchController>()
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server
        .get(`/forced/${Hash256.fake().toString()}`)
        .expect(200)
        .expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/forced/not-a-hash').expect(400)
    })
  })

  describe('/forced/offers/:id', () => {
    const frontendRouter = createOldFrontendRouter(
      mockObject<PositionController>(),
      mockObject<OldHomeController>(),
      mockObject<OldForcedTradeOfferController>({
        getOfferDetailsPage: async () => SUCCESS_RESULT,
      }),
      mockObject<ForcedTransactionController>(),
      mockObject<OldStateUpdateController>(),
      mockObject<OldSearchController>()
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get(`/forced/offers/1`).expect(200).expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/forced/offers/not-a-hash').expect(400)
    })
  })

  describe('/search', () => {
    const { database } = setupDatabaseTestSuite()
    const ethAddress = EthereumAddress.fake()
    const starkKey = StarkKey(
      '0x0054f7db92d7826f24c4db2c9326d31d3f981952e388e770586cc081a41f7f33'
    )
    const rootHash = PedersenHash.fake()

    let server: SuperAgentTest

    before(async () => {
      const stateUpdateRepository = new StateUpdateRepository(
        database,
        Logger.SILENT
      )
      const positionRepository = new PositionRepository(database, Logger.SILENT)

      const userRegistrationEventRepository =
        new UserRegistrationEventRepository(database, Logger.SILENT)

      await stateUpdateRepository.add({
        stateUpdate: {
          id: 0,
          blockNumber: 10_000,
          rootHash,
          stateTransitionHash: Hash256.fake(),
          timestamp: Timestamp(0),
        },
        positions: [
          {
            starkKey: starkKey,
            positionId: 0n,
            collateralBalance: 0n,
            balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
          },
        ],
        prices: [{ assetId: AssetId('ETH-9'), price: 40n }],
      })

      await userRegistrationEventRepository.addMany([
        {
          blockNumber: 1,
          ethAddress,
          starkKey,
        },
      ])

      const searchController = new OldSearchController(
        stateUpdateRepository,
        positionRepository,
        userRegistrationEventRepository
      )
      const frontendRouter = createOldFrontendRouter(
        mockObject<PositionController>(),
        mockObject<OldHomeController>(),
        mockObject<OldForcedTradeOfferController>(),
        mockObject<ForcedTransactionController>(),
        mockObject<OldStateUpdateController>(),
        searchController
      )
      server = createTestApiServer([frontendRouter])
    })

    it('searches for ethereum address', async () => {
      await server
        .get(`/search?query=${ethAddress.toString()}`)
        .expect(302)
        .expect('Location', '/positions/0')
    })

    it('searches for starknet key', async () => {
      await server
        .get(`/search?query=${starkKey.toString()}`)
        .expect(302)
        .expect('Location', '/positions/0')
    })

    it('searches for state tree hash', async () => {
      await server
        .get(`/search?query=0x${rootHash.toString()}`)
        .expect(302)
        .expect('Location', '/state-updates/0')
    })
  })
})
