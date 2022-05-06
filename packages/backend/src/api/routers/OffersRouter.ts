import { AssetId, StarkKey } from '@explorer/types'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { z } from 'zod'

import { OfferController } from '../controllers/OfferController'
import { stringAs, stringAsBigInt, withTypedContext } from './types'

export function createOffersRouter(offerController: OfferController) {
  const router = new Router()

  router.post(
    '/offer',
    bodyParser(),
    withTypedContext(
      z.object({
        body: z.object({
          starkKeyA: stringAs(StarkKey),
          positionIdA: stringAsBigInt(),
          syntheticAssetId: stringAs(AssetId),
          amountCollateral: stringAsBigInt(),
          amountSynthetic: stringAsBigInt(),
          aIsBuyingSynthetic: z.boolean(),
        }),
      }),
      async (ctx) => {
        const result = await offerController.postOffer(ctx.request.body)
        if (result.type === 'created') {
          ctx.status = 201
        }
      }
    )
  )

  return router
}
