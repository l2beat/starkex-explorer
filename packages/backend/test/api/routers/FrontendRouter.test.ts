import {
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  Timestamp,
} from '@explorer/types'
import { SuperAgentTest } from 'supertest'

import { FrontendController } from '../../../src/api/controllers/FrontendController'
import { createFrontendRouter } from '../../../src/api/routers/FrontendRouter'
import { ForcedTransactionsRepository } from '../../../src/peripherals/database/ForcedTransactionsRepository'
import { StateUpdateRepository } from '../../../src/peripherals/database/StateUpdateRepository'
import { UserRegistrationEventRepository } from '../../../src/peripherals/database/UserRegistrationEventRepository'
import { Logger, LogLevel } from '../../../src/tools/Logger'
import { mock } from '../../mock'
import { setupDatabaseTestSuite } from '../../peripherals/database/setup'
import { createTestApiServer } from '../TestApiServer'

const TEST_PAGE = '<!DOCTYPE html><p>test page</p>'
const SUCCESSFUL_RESPONSE = {
  status: 200 as const,
  html: TEST_PAGE,
}

describe('FrontendRouter', () => {
  describe('/', () => {
    it('returns html', async () => {
      const frontendRouter = createFrontendRouter(
        mock<FrontendController>({
          getHomePage: async () => TEST_PAGE,
        })
      )
      const server = createTestApiServer([frontendRouter])

      await server.get('/').expect(200).expect(TEST_PAGE)
    })
  })

  describe('/state-updates', () => {
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getStateUpdatesPage: async () => ({ status: 200, html: TEST_PAGE }),
      })
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
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getStateUpdateDetailsPage: async () => SUCCESSFUL_RESPONSE,
      })
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
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getPositionDetailsPage: async () => SUCCESSFUL_RESPONSE,
      })
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
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getPositionUpdatePage: async () => SUCCESSFUL_RESPONSE,
      })
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get('/positions/1/updates/1').expect(200).expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/positions/foo/updates/bar').expect(400)
    })
  })

  describe('/forced-transactions', () => {
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getForcedTransactionsPage: async () => TEST_PAGE,
      })
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get('/forced-transactions').expect(200).expect(TEST_PAGE)
    })

    it('accepts pagination params', async () => {
      await server
        .get('/forced-transactions?page=123&perPage=100')
        .expect(200)
        .expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/forced-transactions?page=foo&perPage=bar').expect(400)
    })
  })

  describe('/search', async () => {
    const { knex } = setupDatabaseTestSuite()
    const ethAddress = EthereumAddress.random()
    const starkKey =
      '0x0054f7db92d7826f24c4db2c9326d31d3f981952e388e770586cc081a41f7f33'
    const rootHash = PedersenHash.fake()

    let server: SuperAgentTest

    before(async () => {
      const stateUpdateRepository = new StateUpdateRepository(
        knex,
        Logger.SILENT
      )

      const userRegistrationEventRepository =
        new UserRegistrationEventRepository(knex, Logger.SILENT)

      const forcedTxRepo = new ForcedTransactionsRepository(knex, Logger.SILENT)

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
            publicKey: starkKey,
            positionId: 0n,
            collateralBalance: 0n,
            balances: [{ assetId: AssetId('ETH-9'), balance: 20n }],
          },
        ],
        prices: [{ assetId: AssetId('ETH-9'), price: 40n }],
      })

      await userRegistrationEventRepository.add([
        {
          blockNumber: 1,
          ethAddress,
          starkKey,
        },
      ])

      await forcedTxRepo.addEvents([
        {
          transactionType: 'withdrawal' as const,
          eventType: 'mined' as const,
          amount: 123n,
          blockNumber: 1,
          positionId: 123n,
          publicKey: '123',
          timestamp: Timestamp(0),
          transactionHash: Hash256.fake(),
        },
      ])

      const controller = new FrontendController(
        stateUpdateRepository,
        userRegistrationEventRepository,
        forcedTxRepo
      )
      const frontendRouter = createFrontendRouter(controller)
      server = createTestApiServer([frontendRouter])
    })

    it('searches for ethereum address', async () => {
      await server
        .get(`/search?query=${ethAddress}`)
        .expect(302)
        .expect('Location', '/positions/0')
    })

    it('searches for starknet key', async () => {
      await server
        .get(`/search?query=${starkKey}`)
        .expect(302)
        .expect('Location', '/positions/0')
    })

    it('searches for state tree hash', async () => {
      await server
        .get(`/search?query=0x${rootHash}`)
        .expect(302)
        .expect('Location', '/state-updates/0')
    })
  })
})
