import { FrontendController } from '../../../src/api/controllers/FrontendController'
import { createFrontendRouter } from '../../../src/api/routers/FrontendRouter'
import { mock } from '../../mock'
import { createTestApiServer } from '../TestApiServer'

const TEST_PAGE = '<!DOCTYPE html><p>test page</p>'
const SUCCESFUL_RESPONE = {
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
        getStateUpdatesPage: async () => TEST_PAGE,
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
        getStateUpdateDetailsPage: async () => SUCCESFUL_RESPONE,
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
        getPositionDetailsPage: async () => SUCCESFUL_RESPONE,
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
        getPositionUpdatePage: async () => SUCCESFUL_RESPONE,
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
})
