import { createFrontendRouter } from '../../../src/api/routers/FrontendRouter'
import { StateUpdateRepository } from '../../../src/peripherals/database/StateUpdateRepository'
import { mock } from '../../mock'
import { createTestApiServer } from '../TestApiServer'

describe('FrontendRouter', () => {
  it('/ returns html', async () => {
    const frontendRouter = createFrontendRouter(
      mock<StateUpdateRepository>({
        getStateChangeList: async () => [],
      })
    )
    const server = createTestApiServer([frontendRouter])

    await server
      .get('/')
      .expect(200)
      .expect(/^<!DOCTYPE html>/)
  })
})
