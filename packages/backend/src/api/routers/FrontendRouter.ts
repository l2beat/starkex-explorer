import { EthereumAddress, Hash256 } from '@explorer/types'
import Router from '@koa/router'
import { Context } from 'koa'
import { z } from 'zod'

import { ControllerResult } from '../controllers/ControllerResult'
import { ForcedTransactionController } from '../controllers/ForcedTransactionController'
import { FrontendController } from '../controllers/FrontendController'
import { HomeController } from '../controllers/HomeController'
import { StateUpdateController } from '../controllers/StateUpdateController'
import {
  stringAs,
  stringAsBigInt,
  stringAsInt,
  withTypedContext,
} from './types'

export function createFrontendRouter(
  frontendController: FrontendController,
  homeController: HomeController,
  forcedTransactionController: ForcedTransactionController,
  stateUpdateController: StateUpdateController
) {
  const router = new Router()

  router.get('/', async (ctx) => {
    const account = getAccount(ctx)
    const result = await homeController.getHomePage(account)
    applyControllerResult(ctx, result)
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
        const result =
          await forcedTransactionController.getForcedTransactionsPage(
            page,
            perPage,
            account
          )
        applyControllerResult(ctx, result)
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
        const result =
          await forcedTransactionController.getForcedTransactionDetailsPage(
            hash,
            account
          )
        applyControllerResult(ctx, result)
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
        const result = await stateUpdateController.getStateUpdatesPage(
          page,
          perPage,
          account
        )
        applyControllerResult(ctx, result)
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
        const result = await stateUpdateController.getStateUpdateDetailsPage(
          id,
          account
        )
        applyControllerResult(ctx, result)
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

function applyControllerResult(ctx: Context, result: ControllerResult) {
  if (result.type === 'redirect') {
    ctx.redirect(result.url)
  } else {
    if (result.type === 'success') {
      ctx.status = 200
    } else if (result.type === 'not found') {
      ctx.status = 404
    }
    ctx.body = result.content
  }
}
