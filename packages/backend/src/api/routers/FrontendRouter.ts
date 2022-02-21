import { PedersenHash } from '@explorer/crypto'
import Router from '@koa/router'

import { FrontendController } from '../controllers/FrontendController'

export function createFrontendRouter(
  frontendController: FrontendController,
) {
  const router = new Router()

  router.get('/', async (ctx) => {
    ctx.body = await frontendController.getHomePage()
  })

  router.get('/state-updates', async (ctx) => {
    const page = parseInt(String(ctx.query.page ?? '1'))
    const perPage = parseInt(String(ctx.query.perPage ?? '10'))
    if ([page, perPage].some(Number.isNaN)) {
      ctx.status = 500;
      return;
    }
    ctx.body = await frontendController.getStateChangesPage(page, perPage)
  })

  router.get('/state-updates/:hash', async (ctx) => {
    const hash = PedersenHash(ctx.params.hash)
    ctx.body = await frontendController.getStateChangeDetailsPage(hash)
  })

  router.get('/positions/:positionId', async (ctx) => {
    const positionId = BigInt(ctx.params.positionId)
    ctx.body = await frontendController.getPositionDetailsPage(positionId)
  })

  return router
}
