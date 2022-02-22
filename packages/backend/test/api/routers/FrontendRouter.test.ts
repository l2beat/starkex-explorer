import { FrontendController } from '../../../src/api/controllers/FrontendController'
import { createFrontendRouter } from '../../../src/api/routers/FrontendRouter'
import { mock } from '../../mock'
import { createTestApiServer } from '../TestApiServer'

describe('FrontendRouter', () => {
  describe('/', () => {
    it('returns html', async () => {
      const frontendRouter = createFrontendRouter(
        mock<FrontendController>({
          getHomePage: async () => '<!DOCTYPE html>',
        })
      )
      const server = createTestApiServer([frontendRouter])

      await server
        .get('/')
        .expect(200)
        .expect(/^<!DOCTYPE html>/)
    })
  })
  describe('/state-updates', () => {
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getStateChangesPage: async () => '<!DOCTYPE html>',
      })
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server
        .get('/state-updates')
        .expect(200)
        .expect(/^<!DOCTYPE html>/)
    })
    it('accepts pagination params', async () => {
      await server
        .get('/state-updates?page=123&perPage=100')
        .expect(200)
        .expect(/^<!DOCTYPE html>/)
    })
    it('does not allow invalid input', async () => {
      await server.get('/state-updates?page=foo&perPage=bar').expect(500)
    })
  })
  describe('/state-updates/:hash', () => {
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getStateChangeDetailsPage: async () => '<!DOCTYPE html>',
      })
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server
        .get(
          '/state-updates/52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
        )
        .expect(200)
        .expect(/^<!DOCTYPE html>/)
    })
    it('does not allow invalid input', async () => {
      await server.get('/state-updates/foo').expect(500)
    })
  })
  describe('/positions/:positionId', () => {
    const frontendRouter = createFrontendRouter(
      mock<FrontendController>({
        getPositionDetailsPage: async () => '<!DOCTYPE html>',
      })
    )
    const server = createTestApiServer([frontendRouter])

    it('returns html', async () => {
      await server
        .get('/positions/1')
        .expect(200)
        .expect(/^<!DOCTYPE html>/)
    })
    it('does not allow invalid input', async () => {
      await server.get('/positions/foo').expect(500)
    })
  })
})
