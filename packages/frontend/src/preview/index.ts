import Router from '@koa/router'
import Koa from 'koa'
import serve from 'koa-static'

import { renderHomePage } from '../pages'

const app = new Koa()
const router = new Router()

router.get('/', (ctx) => {
  ctx.body = renderHomePage()
})

app.use(router.routes())
app.use(router.allowedMethods())
app.use(serve('build/static'))

app.listen(8080, () => {
  console.log('Listening at http://localhost:8080')
})
