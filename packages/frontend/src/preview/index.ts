/* eslint-disable import/no-extraneous-dependencies */
import Koa from 'koa'
import serve from 'koa-static'

import { ignoreReactSelectWarning } from './ignoreReactSelectWarning'
import { router } from './routes'

ignoreReactSelectWarning()

const app = new Koa()

app.use(router.routes())
app.use(router.allowedMethods())

app.use(serve('build/static'))

const port = process.env.PORT ?? 8080
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
