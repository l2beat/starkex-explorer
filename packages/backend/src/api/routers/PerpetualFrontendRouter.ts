import { stringAs, stringAsBigInt, stringAsPositiveInt } from '@explorer/shared'
import { AssetId } from '@explorer/types'
import Router from '@koa/router'
import { z } from 'zod'

import { Config } from '../../config'
import { shouldShowL2Transactions } from '../../utils/shouldShowL2Transactions'
import { ForcedActionController } from '../controllers/ForcedActionController'
import { ForcedTradeOfferController } from '../controllers/ForcedTradeOfferController'
import { L2TransactionController } from '../controllers/L2TransactionController'
import { withTypedContext } from './types'
import { applyControllerResult, getGivenUser } from './utils'

export function addPerpetualTradingRoutes(
  router: Router,
  forcedTradeOfferController: ForcedTradeOfferController,
  forcedActionController: ForcedActionController,
  l2TransactionController: L2TransactionController,
  config: Config<'perpetual'>
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
          assetId === config.starkex.collateralAsset.assetId
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
        const givenUser = getGivenUser(ctx)
        const result = await forcedTradeOfferController.getOfferDetailsPage(
          Number(ctx.params.offerId),
          givenUser
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  if (shouldShowL2Transactions(config)) {
    router.get(
      '/l2-transactions/:transactionId',
      withTypedContext(
        z.object({
          params: z.object({
            transactionId: stringAsPositiveInt(),
          }),
        }),
        async (ctx) => {
          const givenUser = getGivenUser(ctx)
          const result =
            await l2TransactionController.getPerpetualL2TransactionDetailsPage(
              givenUser,
              ctx.params.transactionId
            )
          applyControllerResult(ctx, result)
        }
      )
    )
  }
}
