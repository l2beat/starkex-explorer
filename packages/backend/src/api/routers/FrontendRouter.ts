import { renderHomePage } from '@explorer/frontend'
import Router from '@koa/router'
import serve from 'koa-static'
import path from 'path'

export function createFrontendRouter() {
  const router = new Router()

  const staticPath = path.join(
    path.dirname(require.resolve('@explorer/frontend/package.json')),
    'build/static'
  )

  console.log(staticPath)

  router.use((ctx, next) => {
    console.log('called')
    next()
  })

  router.get('/', async (ctx) => {
    ctx.body = renderHomePage()
  })
  router.use('', serve(staticPath))

  return router
}
