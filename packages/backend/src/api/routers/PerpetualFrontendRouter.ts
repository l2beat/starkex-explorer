import { CollateralAsset, stringAs, stringAsBigInt } from '@explorer/shared'
import { AssetId } from '@explorer/types'
import Router from '@koa/router'
import { z } from 'zod'

import { ForcedActionController } from '../controllers/ForcedActionController'
import { ForcedTradeOfferController } from '../controllers/ForcedTradeOfferController'
import { withTypedContext } from './types'
import { applyControllerResult, getGivenUser } from './utils'

export function addPerpetualTradingRoutes(
  router: Router,
  forcedTradeOfferController: ForcedTradeOfferController,
  forcedActionController: ForcedActionController,
  collateralAsset: CollateralAsset
) {
  router.get(
    '/forced/new/:positionId/:assetId',
    withTypedContext(
      z.object({
        params: z.object({
          positionId: stringAsBigInt(),
          assetId: stringAs(AssetId),
        }),
      }),
      async (ctx) => {
        const { positionId, assetId } = ctx.params
        const givenUser = getGivenUser(ctx)

        const result =
          assetId === collateralAsset.assetId
            ? await forcedActionController.getPerpetualForcedWithdrawalPage(
                givenUser,
                positionId,
                assetId
              )
            : await forcedActionController.getPerpetualForcedTradePage(
                givenUser,
                positionId,
                assetId
              )

        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/offers/:offerId',
    withTypedContext(
      z.object({
        params: z.object({
          offerId: z.string(),
        }),
      }),
      async (ctx) => {
        const user = getGivenUser(ctx)
        const result = await forcedTradeOfferController.getOfferDetailsPage(
          Number(ctx.params.offerId),
          user.address
        )
        applyControllerResult(ctx, result)
      }
    )
  )
}
