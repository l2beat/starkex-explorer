import { EthereumAddress } from '@explorer/types'
import Router from '@koa/router'
import { Context } from 'koa'
import Application from 'koa'
import { z } from 'zod'

import {
  ControllerResult,
  FrontendController,
} from '../controllers/FrontendController'
import { stringAsBigInt, stringAsInt, withTypedContext } from './types'

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
        ctx.body = await frontendController.getForcedTransactionsPage(
          page,
          perPage
        )
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

        applyResult(
          await frontendController.getStateUpdatesPage(page, perPage, account),
          ctx
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

        applyResult(
          await frontendController.getStateUpdateDetailsPage(id, account),
          ctx
        )
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

        applyResult(
          await frontendController.getPositionDetailsPage(positionId, account),
          ctx
        )
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

        applyResult(
          await frontendController.getPositionUpdatePage(
            positionId,
            updateId,
            account
          ),
          ctx
        )
      }
    )
  )

  router.get(
    '/search',
    withTypedContext(
      z.object({
        query: z.object({
          query: z.string(),
        }),
      }),
      async (ctx) => {
        const { query } = ctx.query

        applyResult(
          await frontendController.getSearchRedirect(query as any),
          ctx
        )
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

function applyResult(
  controllerResult: ControllerResult,
  ctx: Application.Context
) {
  if (controllerResult.status === 302) {
    ctx.redirect(controllerResult.url)
  } else {
    ctx.status = controllerResult.status
    ctx.body = controllerResult.html
  }
}
