import { FrontendController } from '../../../src/api/controllers/FrontendController'
import { createFrontendRouter } from '../../../src/api/routers/FrontendRouter'
import { mock } from '../../mock'
import { createTestApiServer } from '../TestApiServer'

const TEST_PAGE = '<!DOCTYPE html><p>test page</p>'

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
        getStateChangesPage: async () => TEST_PAGE,
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
      await server.get('/state-updates?page=foo&perPage=bar').expect(500)
    })
  })

  describe('/state-updates/:hash', () => {
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getStateChangeDetailsPage: async () => TEST_PAGE,
      })
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server
        .get(
          '/state-updates/52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
        )
        .expect(200)
        .expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/state-updates/foo').expect(500)
    })
  })

  describe('/positions/:positionId', () => {
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getPositionDetailsPage: async () => TEST_PAGE,
      })
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server.get('/positions/1').expect(200).expect(TEST_PAGE)
    })

    it('does not allow invalid input', async () => {
      await server.get('/positions/foo').expect(500)
    })
  })
})
