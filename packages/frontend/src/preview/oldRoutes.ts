/* eslint-disable import/no-extraneous-dependencies */
import { AssetId, EthereumAddress } from '@explorer/types'
import Router from '@koa/router'
import Koa from 'koa'

import {
  renderOldForcedTradeOfferDetailsPage,
  renderOldForcedTradeOffersIndexPage,
  renderOldForcedTransactionDetailsPage,
  renderOldForcedTransactionsIndexPage,
  renderOldHomePage,
  renderOldNotFoundPage,
  renderOldPositionAtUpdatePage,
  renderOldPositionDetailsPage,
  renderOldStateUpdateDetailsPage,
  renderOldStateUpdatesIndexPage,
  renderTransactionForm,
} from '../view'
import * as DATA from './data'

export const router = new Router()

router.get('/', (ctx) => {
  const data = { ...DATA.HOME_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderOldHomePage(data)
})
router.get('/state-updates', (ctx) => {
  const data = { ...DATA.STATE_CHANGES_INDEX_PROPS }
  data.params = {
    page: ctx.query.page ? Number(ctx.query.page) : 1,
    perPage: ctx.query.perPage ? Number(ctx.query.perPage) : 10,
  }
  data.account = getAccount(ctx)
  ctx.body = renderOldStateUpdatesIndexPage(data)
})
router.get('/state-updates/:hash', (ctx) => {
  const data = { ...DATA.STATE_CHANGE_DETAILS_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderOldStateUpdateDetailsPage(data)
})
router.get('/positions/:positionId', (ctx) => {
  const data = { ...DATA.POSITION_DETAILS_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderOldPositionDetailsPage(data)
})
router.get('/positions/:positionId/updates/:updateId', (ctx) => {
  const data = { ...DATA.POSITION_AT_UPDATE_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderOldPositionAtUpdatePage(data)
})
router.get('/forced', (ctx) => {
  const data = { ...DATA.FORCED_TRANSACTIONS_INDEX_PROPS }
  data.params = {
    page: ctx.query.page ? Number(ctx.query.page) : 1,
    perPage: ctx.query.perPage ? Number(ctx.query.perPage) : 10,
  }
  data.account = getAccount(ctx)
  ctx.body = renderOldForcedTransactionsIndexPage(data)
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
  ctx.body = renderOldForcedTradeOffersIndexPage(data)
})
router.get('/forced/offers/:id', (ctx) => {
  const data = { ...DATA.FORCED_TRADE_OFFER_DETAILS_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderOldForcedTradeOfferDetailsPage(data)
})
router.get('/forced/:hash', (ctx) => {
  const data = { ...DATA.FORCED_TRANSACTION_DETAILS_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderOldForcedTransactionDetailsPage(data)
})
router.post('/forced/offers', (ctx) => {
  ctx.status = 201
  ctx.body = { id: 1 }
})
router.get('/not-found', (ctx) => {
  const data = { ...DATA.NOT_FOUND_PROPS }
  data.account = getAccount(ctx)
  ctx.body = renderOldNotFoundPage(data)
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