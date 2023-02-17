/* eslint-disable import/no-extraneous-dependencies */
import Koa from 'koa'
import serve from 'koa-static'

import { USE_NEW_DESIGN } from '../utils/constants'
import { router as oldRouter } from './oldRoutes'
import { router } from './routes'

const app = new Koa()

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (USE_NEW_DESIGN) {
  app.use(router.routes())
  app.use(router.allowedMethods())
} else {
  app.use(oldRouter.routes())
  app.use(oldRouter.allowedMethods())
}

app.use(serve('build/static'))

const port = process.env.PORT ?? 8080
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
