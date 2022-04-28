import { EthereumAddress, Hash256 } from '@explorer/types'
import Router from '@koa/router'
import { Context } from 'koa'
import { z } from 'zod'

import { FrontendController } from '../controllers/FrontendController'
import {
  stringAs,
  stringAsBigInt,
  stringAsInt,
  withTypedContext,
} from './types'

export function createFrontendRouter(frontendController: FrontendController) {
  const router = new Router()

  router.get('/', async (ctx) => {
    const account = getAccount(ctx)
    ctx.body = await frontendController.getHomePage(account)
  })

  router.get(
    '/forced-transactions',
    withTypedContext(
      z.object({
        query: z.object({
          page: stringAsInt(1),
          perPage: stringAsInt(10),
        }),
      }),
      async (ctx) => {
        const { page, perPage } = ctx.query
        const account = getAccount(ctx)
        ctx.body = await frontendController.getForcedTransactionsPage(
          page,
          perPage,
          account
        )
      }
    )
  )

  router.get(
    '/forced-transactions/:hash',
    withTypedContext(
      z.object({
        params: z.object({
          hash: stringAs(Hash256),
        }),
      }),
      async (ctx) => {
        const { hash } = ctx.params
        const account = getAccount(ctx)
        const { html, status } =
          await frontendController.getForcedTransactionDetailsPage(
            hash,
            account
          )
        ctx.body = html
        ctx.status = status
      }
    )
  )

  router.get(
    '/state-updates',
    withTypedContext(
      z.object({
        query: z.object({
          page: stringAsInt(1),
          perPage: stringAsInt(10),
        }),
      }),
      async (ctx) => {
        const { page, perPage } = ctx.query
        const account = getAccount(ctx)
        ctx.body = await frontendController.getStateUpdatesPage(
          page,
          perPage,
          account
        )
      }
    )
  )

  router.get(
    '/state-updates/:id',
    withTypedContext(
      z.object({
        params: z.object({
          id: stringAsInt(),
        }),
      }),
      async (ctx) => {
        const { id } = ctx.params
        const account = getAccount(ctx)
        const { status, html } =
          await frontendController.getStateUpdateDetailsPage(id, account)
        ctx.body = html
        ctx.status = status
      }
    )
  )

  router.get(
    '/positions/:positionId',
    withTypedContext(
      z.object({
        params: z.object({
          positionId: stringAsBigInt(),
        }),
      }),
      async (ctx) => {
        const { positionId } = ctx.params
        const account = getAccount(ctx)
        const { status, html } =
          await frontendController.getPositionDetailsPage(positionId, account)
        ctx.body = html
        ctx.status = status
      }
    )
  )

  router.get(
    '/positions/:positionId/updates/:updateId',
    withTypedContext(
      z.object({
        params: z.object({
          positionId: stringAsBigInt(),
          updateId: stringAsInt(),
        }),
      }),
      async (ctx) => {
        const { positionId, updateId } = ctx.params
        const account = getAccount(ctx)
        const { status, html } = await frontendController.getPositionUpdatePage(
          positionId,
          updateId,
          account
        )
        ctx.body = html
        ctx.status = status
      }
    )
  )

  return router
}

export function getAccount(ctx: Context) {
  const cookie = ctx.cookies.get('account')
  if (cookie) {
    try {
      return EthereumAddress(cookie)
    } catch {
      return
    }
  }
}
