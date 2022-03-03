import Router from '@koa/router'
import { z } from 'zod'

import { FrontendController } from '../controllers/FrontendController'
import { brandedString, stringToPositiveInt, withTypedContext } from './types'

export function createFrontendRouter(frontendController: FrontendController) {
  const router = new Router()

  router.get('/', async (ctx) => {
    ctx.body = await frontendController.getHomePage()
  })

  router.get(
    '/state-updates',
    withTypedContext(
      z.object({
        query: z.object({
          page: stringToPositiveInt('1'),
          perPage: stringToPositiveInt('10'),
        }),
      }),
      async (ctx) => {
        const { page, perPage } = ctx.query
        ctx.body = await frontendController.getStateChangesPage(page, perPage)
      }
    )
  )

  router.get(
    '/state-updates/:id',
    withTypedContext(
      z.object({
        params: z.object({
          id: stringToPositiveInt(),
        }),
      }),
      async (ctx) => {
        const { id } = ctx.params
        const { status, html } =
          await frontendController.getStateChangeDetailsPage(id)
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
          positionId: brandedString(BigInt),
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
          positionId: brandedString(BigInt),
          updateId: brandedString(Number),
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
