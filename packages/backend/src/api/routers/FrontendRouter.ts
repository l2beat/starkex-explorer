import { PedersenHash } from '@explorer/crypto'
import Router from '@koa/router'
import { z } from 'zod'

import { FrontendController } from '../controllers/FrontendController'

const stringToPositiveInt = (def: string) =>
  z.preprocess(
    (s) => parseInt(z.string().parse(s || def), 10),
    z.number().positive()
  )

function brandedString<T>(brandedType: (value: string) => T) {
  return z
    .string()
    .refine((v) => {
      try {
        brandedType(v)
        return true
      } catch {
        return false
      }
    })
    .transform(brandedType)
}

const StateUpdatesQuery = z.object({
  page: stringToPositiveInt('1'),
  perPage: stringToPositiveInt('10'),
})

const StateChangeDetailsQuery = z.object({
  hash: brandedString(PedersenHash),
})

const PositionQuery = z.object({
  positionId: brandedString(BigInt),
})

export function createFrontendRouter(frontendController: FrontendController) {
  const router = new Router()

  router.get('/', async (ctx) => {
    ctx.body = await frontendController.getHomePage()
  })

  router.get('/state-updates', async (ctx) => {
    const parseResult = StateUpdatesQuery.safeParse(ctx.query)
    if (!parseResult.success) {
      ctx.status = 400
      ctx.body = { issues: parseResult.error.issues }
      return
    }
    const {
      data: { page, perPage },
    } = parseResult
    ctx.body = await frontendController.getStateChangesPage(page, perPage)
  })

  router.get('/state-updates/:hash', async (ctx) => {
    const parseResult = StateChangeDetailsQuery.safeParse(ctx.params)
    if (!parseResult.success) {
      ctx.status = 400
      ctx.body = { issues: parseResult.error.issues }
      return
    }
    const {
      data: { hash },
    } = parseResult
    ctx.body = await frontendController.getStateChangeDetailsPage(hash)
  })

  router.get('/positions/:positionId', async (ctx) => {
    const parseResult = PositionQuery.safeParse(ctx.params)
    if (!parseResult.success) {
      ctx.status = 400
      ctx.body = { issues: parseResult.error.issues }
      return
    }
    const {
      data: { positionId },
    } = parseResult
    ctx.body = await frontendController.getPositionDetailsPage(positionId)
  })

  return router
}
