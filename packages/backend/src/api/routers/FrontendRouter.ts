import Router from '@koa/router'
import { z } from 'zod'

import { FrontendController } from '../controllers/FrontendController'
import { stringAsBigInt, stringAsInt, withTypedContext } from './types'

export function createFrontendRouter(frontendController: FrontendController) {
  const router = new Router()

  router.get('/', async (ctx) => {
    ctx.body = await frontendController.getHomePage()
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
        ctx.body = await frontendController.getStateUpdatesPage(page, perPage)
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
        const { status, html } =
          await frontendController.getStateUpdateDetailsPage(id)
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
        const { status, html } =
          await frontendController.getPositionDetailsPage(positionId)
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
        const { status, html } = await frontendController.getPositionUpdatePage(
          positionId,
          updateId
        )
        ctx.body = html
        ctx.status = status
      }
    )
  )

  return router
}
