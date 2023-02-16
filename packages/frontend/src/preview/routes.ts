/* eslint-disable import/no-extraneous-dependencies */
import { AssetId, EthereumAddress } from '@explorer/types'
import Router from '@koa/router'
import Koa from 'koa'

import {
  renderForcedWithdrawPage,
  renderHomePage,
  renderUserPage,
} from '../view'
import { renderForcedTradePage } from '../view/pages/forcedactions/ForcedTradePage'
import * as DATA from './data'

export const router = new Router()

router.get('/', (ctx) => {
  const account = getAccount(ctx)
  ctx.body = renderHomePage({ title: 'foo', account })
})

//This is a route for an easier access to the specific forced actions page
router.get('/forced/new/:page', (ctx) => {
  if (ctx.params.page) {
    switch (ctx.params.page) {
      case 'withdraw':
        const withdrawData = { ...DATA.FORCED_WITHDRAW_FORM_PROPS }
        withdrawData.account = getAccount(ctx) ?? withdrawData.account
        ctx.body = renderForcedWithdrawPage(withdrawData)
        break
      case 'sell':
        const sellData = { ...DATA.FORCED_SELL_FORM_PROPS }
        sellData.account = getAccount(ctx) ?? sellData.account
        ctx.body = renderForcedTradePage(sellData)
        break
      case 'buy':
        const buyData = { ...DATA.FORCED_BUY_FORM_PROPS }
        buyData.account = getAccount(ctx) ?? buyData.account
        ctx.body = renderForcedTradePage(buyData)
        break
    }
  }
})

router.get('/forced/new/:positionId/:assetId', (ctx) => {
  if (!ctx.params.positionId || !ctx.params.assetId) {
    return
  }
  const data = { ...DATA.FORCED_ACTION_FORM_PROPS }
  const positionId = ctx.params.positionId
  const assetId = AssetId(ctx.params.assetId)
  if (data.assets.find((asset) => asset.assetId === assetId) === undefined) {
    return
  }
  data.account = getAccount(ctx) ?? data.account
  data.selectedAsset = assetId
  data.positionId = BigInt(positionId)
  if (data.selectedAsset === AssetId.USDC) {
    ctx.body = renderForcedWithdrawPage(data)
    return
  }

  ctx.body = renderForcedTradePage(data)
})

router.get('/user', (ctx) => {
  const account = getAccount(ctx)
  ctx.body = renderUserPage({ ...DATA.USER_PROPS, account })
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
