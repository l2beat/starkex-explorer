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
        ctx.body = await frontendController.getStateChangeDetailsPage(id)
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
        ctx.body = await frontendController.getPositionDetailsPage(positionId)
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
        ctx.body = await frontendController.getPositionUpdatePage(
          positionId,
          updateId
        )
      }
    )
  )

  return router
}
