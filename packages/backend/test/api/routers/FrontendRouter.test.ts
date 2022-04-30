import { Hash256 } from '@explorer/types'

import { ControllerSuccessResult } from '../../../src/api/controllers/ControllerResult'
import { ForcedTransactionController } from '../../../src/api/controllers/ForcedTransactionController'
import { HomeController } from '../../../src/api/controllers/HomeController'
import { PositionController } from '../../../src/api/controllers/PositionController'
import { StateUpdateController } from '../../../src/api/controllers/StateUpdateController'
import { createFrontendRouter } from '../../../src/api/routers/FrontendRouter'
import { mock } from '../../mock'
import { createTestApiServer } from '../TestApiServer'

const TEST_PAGE = '<!DOCTYPE html><p>test page</p>'
const SUCCESS_RESULT: ControllerSuccessResult = {
  type: 'success',
  content: TEST_PAGE,
}

describe('FrontendRouter', () => {
  describe('/', () => {
    it('returns html', async () => {
      const frontendRouter = createFrontendRouter(
        mock<PositionController>(),
        mock<HomeController>({
          getHomePage: async () => SUCCESS_RESULT,
        }),
        mock<ForcedTransactionController>(),
        mock<StateUpdateController>()
      )
      const server = createTestApiServer([frontendRouter])

      await server.get('/').expect(200).expect(TEST_PAGE)
    })
  })

  describe('/state-updates', () => {
    const frontendRouter = createFrontendRouter(
      mock<PositionController>(),
      mock<HomeController>(),
      mock<ForcedTransactionController>(),
      mock<StateUpdateController>({
        getStateUpdatesPage: async () => SUCCESS_RESULT,
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
      mock<PositionController>(),
      mock<HomeController>(),
      mock<ForcedTransactionController>(),
      mock<StateUpdateController>({
        getStateUpdateDetailsPage: async () => SUCCESS_RESULT,
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
      mock<PositionController>({
        getPositionDetailsPage: async () => SUCCESS_RESULT,
      }),
      mock<HomeController>(),
      mock<ForcedTransactionController>(),
      mock<StateUpdateController>()
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
      mock<PositionController>({
        getPositionUpdatePage: async () => SUCCESS_RESULT,
      }),
      mock<HomeController>(),
      mock<ForcedTransactionController>(),
      mock<StateUpdateController>()
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
      mock<PositionController>(),
      mock<HomeController>(),
      mock<ForcedTransactionController>({
        getForcedTransactionsPage: async () => SUCCESS_RESULT,
      }),
      mock<StateUpdateController>()
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

  describe('/forced-transactions/:hash', () => {
    const frontendRouter = createFrontendRouter(
      mock<PositionController>(),
      mock<HomeController>(),
      mock<ForcedTransactionController>({
        getForcedTransactionDetailsPage: async () => SUCCESS_RESULT,
      }),
      mock<StateUpdateController>()
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server
        .get(`/forced-transactions/${Hash256.fake()}`)
        .expect(200)
        .expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/forced-transactions/not-a-hash').expect(400)
    })
  })
})
