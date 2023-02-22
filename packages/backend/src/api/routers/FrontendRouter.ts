import Router from '@koa/router'

export function createFrontendRouter() {
  const router = new Router()

  router.get('/', async (ctx) => {
    ctx.body = 'Hello World'
  })

  return router
}
