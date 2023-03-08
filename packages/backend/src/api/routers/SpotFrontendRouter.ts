import { stringAsBigInt } from '@explorer/shared'
import Router from '@koa/router'
import { z } from 'zod'

import { ForcedActionController } from '../controllers/ForcedActionController'
import { withTypedContext } from './types'
import { applyControllerResult, getGivenUser } from './utils'

export function addSpotRoutes(
  router: Router,
  forcedActionController: ForcedActionController
) {
  router.get(
    '/forced/new/:vaultId',
    withTypedContext(
      z.object({
        params: z.object({
          vaultId: stringAsBigInt(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result = await forcedActionController.getSpotForcedWithdrawalPage(
          givenUser,
          ctx.params.vaultId
        )
        applyControllerResult(ctx, result)
      }
    )
  )
}
