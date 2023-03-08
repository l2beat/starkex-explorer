import { stringAs, stringAsBigInt } from '@explorer/shared'
import { AssetId } from '@explorer/types'
import Router from '@koa/router'
import { z } from 'zod'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { ForcedActionController } from '../controllers/ForcedActionController'
import { withTypedContext } from './types'
import { applyControllerResult, getGivenUser } from './utils'

export function addPerpetualRoutes(
  router: Router,
  forcedActionController: ForcedActionController,
  collateralAsset: CollateralAsset | undefined
) {
  router.get(
    '/forced/new/perpetual/:positionId/:assetId',
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
          assetId === collateralAsset?.assetId
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
}
