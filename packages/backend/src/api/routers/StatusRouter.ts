import Router from '@koa/router'

export function createStatusRouter() {
  const router = new Router()

  router.get('/status', async (ctx) => {
    ctx.body = { ok: true }
  })

  return router
}
