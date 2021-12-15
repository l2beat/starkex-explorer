import { renderHomePage } from '@explorer/frontend'
import Router from '@koa/router'

export function createFrontendRouter() {
  const router = new Router()

  router.get('/', async (ctx) => {
    ctx.body = renderHomePage()
  })

  return router
}
