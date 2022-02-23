import { PedersenHash } from '@explorer/crypto'
import Router from '@koa/router'
import { z } from 'zod'

import {
  brandedString,
  stringToPositiveInt,
  withRequestDataParsing,
} from '../../tools/RequestDataParsing'
import { FrontendController } from '../controllers/FrontendController'

const GetStateChangesParser = z.object({
  query: z.object({
    page: stringToPositiveInt('1'),
    perPage: stringToPositiveInt('10'),
  }),
})

const GetStateChangeDetailsParser = z.object({
  params: z.object({
    hash: brandedString(PedersenHash),
  }),
})

const GetPositionDetailsParser = z.object({
  params: z.object({
    positionId: brandedString(BigInt),
  }),
})

export function createFrontendRouter(frontendController: FrontendController) {
  const router = new Router()

  router.get('/', async (ctx) => {
    ctx.body = await frontendController.getHomePage()
  })

  router.get(
    '/state-updates',
    withRequestDataParsing(
      GetStateChangesParser,
      async (ctx, { query: { page, perPage } }) => {
        ctx.body = await frontendController.getStateChangesPage(page, perPage)
      }
    )
  )

  router.get(
    '/state-updates/:hash',
    withRequestDataParsing(
      GetStateChangeDetailsParser,
      async (ctx, { params: { hash } }) => {
        ctx.body = await frontendController.getStateChangeDetailsPage(hash)
      }
    )
  )

  router.get(
    '/positions/:positionId',
    withRequestDataParsing(
      GetPositionDetailsParser,
      async (ctx, { params: { positionId } }) => {
        ctx.body = await frontendController.getPositionDetailsPage(positionId)
      }
    )
  )

  return router
}
