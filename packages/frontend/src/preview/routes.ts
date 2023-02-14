/* eslint-disable import/no-extraneous-dependencies */
import { EthereumAddress } from '@explorer/types'
import Router from '@koa/router'
import Koa from 'koa'

import { renderHomePage, renderUserPage } from '../view'
import * as DATA from './data'

export const router = new Router()

router.get('/', (ctx) => {
  const account = getAccount(ctx)
  ctx.body = renderHomePage({ title: 'foo', account })
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
