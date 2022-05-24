import { AcceptOfferBody, CreateOfferBody, stringAsInt } from '@explorer/shared'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { z } from 'zod'

import { ForcedTradeOfferController } from '../controllers/ForcedTradeOfferController'
import { withTypedContext } from './types'
import { applyControllerResult } from './utils'

export function createForcedTradeOfferRouter(
  offerController: ForcedTradeOfferController
) {
  const router = new Router()

  router.post(
    '/forced/offers',
    bodyParser(),
    withTypedContext(
      z.object({
        request: z.object({ body: CreateOfferBody }),
      }),
      async (ctx) => {
        const { offer, signature } = ctx.request.body
        const result = await offerController.postOffer(offer, signature)
        applyControllerResult(ctx, result)
      }
    )
  )

  router.put(
    '/forced/offers/:initialOfferId',
    bodyParser(),
    withTypedContext(
      z.object({
        params: z.object({ initialOfferId: stringAsInt() }),
        request: z.object({ body: AcceptOfferBody }),
      }),
      async (ctx) => {
        const result = await offerController.acceptOffer(
          ctx.params.initialOfferId,
          ctx.request.body
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.post(
    '/forced/offers/:offerId/cancel',
    bodyParser(),
    withTypedContext(
      z.object({
        params: z.object({
          offerId: stringAsInt(),
        }),
        request: z.object({
          body: z.object({
            signature: z.string(),
          }),
        }),
      }),
      async (ctx) => {
        const result = await offerController.cancelOffer(
          ctx.params.offerId,
          ctx.request.body.signature
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  return router
}
