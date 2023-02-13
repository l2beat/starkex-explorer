/* eslint-disable import/no-extraneous-dependencies */
import Koa from 'koa'
import serve from 'koa-static'

import { router as oldRouter } from './oldRoutes'
import { router } from './routes'

const app = new Koa()

const IS_OLD = false

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (IS_OLD) {
  app.use(oldRouter.routes())
  app.use(oldRouter.allowedMethods())
} else {
  app.use(router.routes())
  app.use(router.allowedMethods())
}

app.use(serve('build/static'))

const port = process.env.PORT ?? 8080
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
