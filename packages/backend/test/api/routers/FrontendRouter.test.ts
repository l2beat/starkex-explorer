import { createFrontendRouter } from '../../../src/api/routers/FrontendRouter'
import { createTestApiServer } from '../TestApiServer'

describe('FrontendRouter', () => {
  it('/ returns html', async () => {
    const frontendRouter = createFrontendRouter()
    const server = createTestApiServer([frontendRouter])

    await server
      .get('/')
      .expect(200)
      .expect(/^<!DOCTYPE html>/)
  })
})
