/* eslint-disable import/no-extraneous-dependencies */
import { AssetId, EthereumAddress } from '@explorer/types'
import Router from '@koa/router'
import Koa from 'koa'
import serve from 'koa-static'

import {
  renderForcedTradeOfferDetailsPage,
  renderForcedTradeOffersIndexPage,
  renderForcedTransactionDetailsPage,
  renderForcedTransactionsIndexPage,
  renderHomePage,
  renderNotFoundPage,
  renderPositionAtUpdatePage,
  renderPositionDetailsPage,
  renderStateUpdateDetailsPage,
  renderStateUpdatesIndexPage,
  renderTransactionForm,
} from '../pages'
import { renderUserPage } from '../pages/newUser'
import * as DATA from './data'

const app = new Koa()
const router = new Router()

router.get('/', (ctx) => {
  const data = { ...DATA.HOME_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderHomePage(data)
})
router.get('/user', (ctx) => {
  const data = { ...DATA.USER_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderUserPage(data)
})
router.get('/state-updates', (ctx) => {
  const data = { ...DATA.STATE_CHANGES_INDEX_PROPS }
  data.params = {
    page: ctx.query.page ? Number(ctx.query.page) : 1,
    perPage: ctx.query.perPage ? Number(ctx.query.perPage) : 10,
  }
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
router.get('/forced', (ctx) => {
  const data = { ...DATA.FORCED_TRANSACTIONS_INDEX_PROPS }
  data.params = {
    page: ctx.query.page ? Number(ctx.query.page) : 1,
    perPage: ctx.query.perPage ? Number(ctx.query.perPage) : 10,
  }
  data.account = getAccount(ctx)
  ctx.body = renderForcedTransactionsIndexPage(data)
})
router.get('/forced/new', (ctx) => {
  const data = { ...DATA.TRANSACTION_FORM_PROPS }
  data.account = getAccount(ctx) ?? data.account
  ctx.body = renderTransactionForm(data)
})
router.get('/forced/offers', (ctx) => {
  const data = { ...DATA.FORCED_TRADE_OFFERS_INDEX_PROPS }
  data.params = {
    page: ctx.query.page ? Number(ctx.query.page) : 1,
    perPage: ctx.query.perPage ? Number(ctx.query.perPage) : 10,
    assetId: ctx.query.assetId ? AssetId(String(ctx.query.assetId)) : undefined,
    type: (['buy', 'sell'] as const).find((type) => type === ctx.query.type),
  }
  data.account = getAccount(ctx)
  ctx.body = renderForcedTradeOffersIndexPage(data)
})
router.get('/forced/offers/:id', (ctx) => {
  const data = { ...DATA.FORCED_TRADE_OFFER_DETAILS_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderForcedTradeOfferDetailsPage(data)
})
router.get('/forced/:hash', (ctx) => {
  const data = { ...DATA.FORCED_TRANSACTION_DETAILS_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderForcedTransactionDetailsPage(data)
})
router.post('/forced/offers', (ctx) => {
  ctx.status = 201
  ctx.body = { id: 1 }
})
router.get('/not-found', (ctx) => {
  const data = { ...DATA.NOT_FOUND_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderNotFoundPage(data)
})

function getAccount(ctx: Koa.Context) {
  const cookie = ctx.cookies.get('account')
  if (cookie) {
    try {
      return {
        address: EthereumAddress(cookie),
        positionId: 123n,
        hasUpdates: Math.random() < 0.5,
      }
    } catch {
      return
    }
  }
}

app.use(router.routes())
app.use(router.allowedMethods())
app.use(serve('build/static'))

const port = process.env.PORT ?? 8080
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
