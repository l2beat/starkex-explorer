/* eslint-disable import/no-extraneous-dependencies */
import Router from '@koa/router'
import Koa from 'koa'
import serve from 'koa-static'

import {
  renderHomePage,
  renderPositionAtUpdatePage,
  renderPositionDetailsPage,
  renderStateUpdateDetailsPage,
  renderStateUpdatesIndexPage,
} from '../pages'
import * as DATA from './data'

const app = new Koa()
const router = new Router()

router.get('/', (ctx) => {
  const data = { ...DATA.HOME_PROPS }
  data.account = ctx.cookies.get('account')
  ctx.body = renderHomePage(data)
})
router.get('/state-updates', (ctx) => {
  const data = { ...DATA.STATE_CHANGES_INDEX_PROPS }
  data.account = ctx.cookies.get('account')
  ctx.body = renderStateUpdatesIndexPage(data)
})
router.get('/state-updates/:hash', (ctx) => {
  const data = { ...DATA.STATE_CHANGE_DETAILS_PROPS }
  data.account = ctx.cookies.get('account')
  ctx.body = renderStateUpdateDetailsPage(data)
})
router.get('/positions/:positionId', (ctx) => {
  const data = { ...DATA.POSITION_DETAILS_PROPS }
  data.account = ctx.cookies.get('account')
  ctx.body = renderPositionDetailsPage(data)
})
router.get('/positions/:positionId/updates/:updateId', (ctx) => {
  const data = { ...DATA.POSITION_AT_UPDATE_PROPS }
  data.account = ctx.cookies.get('account')
  ctx.body = renderPositionAtUpdatePage(data)
})

app.use(router.routes())
app.use(router.allowedMethods())
app.use(serve('build/static'))

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
