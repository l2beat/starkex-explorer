/* eslint-disable import/no-extraneous-dependencies */
import { EthereumAddress } from '@explorer/types'
import Router from '@koa/router'
import Koa from 'koa'
import serve from 'koa-static'

import {
  renderForcedTransactionDetailsPage,
  renderForcedTransactionsIndexPage,
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
  data.account = getAccount(ctx)
  ctx.body = renderHomePage(data)
})
router.get('/state-updates', (ctx) => {
  const data = { ...DATA.STATE_CHANGES_INDEX_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderStateUpdatesIndexPage(data)
})
router.get('/state-updates/:hash', (ctx) => {
  const data = { ...DATA.STATE_CHANGE_DETAILS_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderStateUpdateDetailsPage(data)
})
router.get('/positions/:positionId', (ctx) => {
  const data = { ...DATA.POSITION_DETAILS_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderPositionDetailsPage(data)
})
router.get('/positions/:positionId/updates/:updateId', (ctx) => {
  const data = { ...DATA.POSITION_AT_UPDATE_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderPositionAtUpdatePage(data)
})
router.get('/forced-transactions', (ctx) => {
  const data = { ...DATA.FORCED_TRANSACTIONS_INDEX_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderForcedTransactionsIndexPage(data)
})
router.get('/forced-transactions/:hash', (ctx) => {
  const data = { ...DATA.FORCED_TRANSACTION_DETAILS_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderForcedTransactionDetailsPage(data)
})

function getAccount(ctx: Koa.Context) {
  const cookie = ctx.cookies.get('account')
  if (cookie) {
    try {
      return EthereumAddress(cookie)
    } catch {
      return
    }
  }
}

app.use(router.routes())
app.use(router.allowedMethods())
app.use(serve('build/static'))

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
