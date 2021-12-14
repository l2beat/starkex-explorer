import { createStatusRouter } from '../../../src/api/routers/StatusRouter'
import { createTestApiServer } from '../TestApiServer'

describe('StatusRouter', () => {
  it('/status returns a simple ok', async () => {
    const statusRouter = createStatusRouter()
    const server = createTestApiServer([statusRouter])

    await server.get('/status').expect(200).expect({ ok: true })
  })
})
