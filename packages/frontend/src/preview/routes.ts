/* eslint-disable import/no-extraneous-dependencies */
import { EthereumAddress } from '@explorer/types'
import Router from '@koa/router'
import Koa from 'koa'

import { renderForcedWithdrawPage, renderHomePage } from '../view'
import { renderForcedTradePage } from '../view/pages/forcedactions/ForcedTradePage'
import * as DATA from './data'

export const router = new Router()

router.get('/', (ctx) => {
  const account = getAccount(ctx)
  ctx.body = renderHomePage({ title: 'foo', account })
})

router.get('/forced/new/:page', (ctx) => {
  const data = { ...DATA.TRANSACTION_FORM_PROPS }
  data.account = getAccount(ctx) ?? data.account
  if (ctx.params.page) {
    switch (ctx.params.page) {
      case 'withdraw':
        ctx.body = renderForcedWithdrawPage(data)
        break
      case 'trade':
        ctx.body = renderForcedTradePage(data)
        break
    }
  }
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
