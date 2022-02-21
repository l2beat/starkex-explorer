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
        }),
      )
      const server = createTestApiServer([frontendRouter])
  
      await server
        .get('/')
        .expect(200)
        .expect(/^<!DOCTYPE html>/)
    }) 
  })
  describe('/state-updates', () => {
    it('returns html', async () => {
      const frontendRouter = createFrontendRouter(
        mock<FrontendController>({
          getStateChangesPage: async () => '<!DOCTYPE html>',
        }),
      )
      const server = createTestApiServer([frontendRouter])
  
      await server
        .get('/state-updates')
        .expect(200)
        .expect(/^<!DOCTYPE html>/)
    })
  })
  describe('/state-updates/:hash', () => {
    it('returns html', async () => {
      const frontendRouter = createFrontendRouter(
        mock<FrontendController>({
          getStateChangeDetailsPage: async () => '<!DOCTYPE html>',
        }),
      )
      const server = createTestApiServer([frontendRouter])
  
      await server
        .get('/state-updates/52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626')
        .expect(200)
        .expect(/^<!DOCTYPE html>/)
    })
  })
  describe('/positions/:positionId', () => {
    it('returns html', async () => {
      const frontendRouter = createFrontendRouter(
        mock<FrontendController>({
          getPositionDetailsPage: async () => '<!DOCTYPE html>',
        }),
      )
      const server = createTestApiServer([frontendRouter])
  
      await server
        .get('/positions/1')
        .expect(200)
        .expect(/^<!DOCTYPE html>/)
    })
  })
})
