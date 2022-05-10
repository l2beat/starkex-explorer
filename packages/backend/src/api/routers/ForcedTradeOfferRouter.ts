import { AssetId, StarkKey } from '@explorer/types'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { string, z } from 'zod'

import { ForcedTradeOfferController } from '../controllers/ForcedTradeOfferController'
import { applyControllerResult } from './FrontendRouter'
import {
  stringAs,
  stringAsBigInt,
  stringAsInt,
  withTypedContext,
} from './types'

export function createForcedTradeOfferRouter(
  offerController: ForcedTradeOfferController
) {
  const router = new Router()

  router.post(
    '/offer',
    bodyParser(),
    withTypedContext(
      z.object({
        request: z.object({
          body: z.object({
            starkKeyA: stringAs(StarkKey),
            positionIdA: stringAsBigInt(),
            syntheticAssetId: stringAs(AssetId),
            amountCollateral: stringAsBigInt(),
            amountSynthetic: stringAsBigInt(),
            aIsBuyingSynthetic: z.boolean(),
          }),
        }),
      }),
      async (ctx) => {
        const result = await offerController.postOffer(ctx.request.body)
        applyControllerResult(ctx, result)
      }
    )
  )

  router.post(
    '/offer/:initialOfferId/accept',
    bodyParser(),
    withTypedContext(
      z.object({
        params: z.object({
          initialOfferId: stringAsInt(),
        }),
        request: z.object({
          body: z.object({
            starkKeyB: stringAs(StarkKey),
            positionIdB: stringAsBigInt(),
            submissionExpirationTime: stringAsInt(), // Timestamp?
            nonce: stringAsBigInt(),
            signature: string(),
          }),
        }),
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

  return router
}
