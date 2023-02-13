/* eslint-disable import/no-extraneous-dependencies */
import Router from '@koa/router'

import { renderHomePage } from '../view'

export const router = new Router()

router.get('/', (ctx) => {
  ctx.body = renderHomePage({ title: 'foo' })
})
