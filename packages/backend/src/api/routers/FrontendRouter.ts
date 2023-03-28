import {
  stringAs,
  stringAsBigInt,
  stringAsPositiveInt,
  TradingMode,
} from '@explorer/shared'
import { Hash256, StarkKey } from '@explorer/types'
import Router from '@koa/router'
import * as z from 'zod'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { ForcedActionController } from '../controllers/ForcedActionController'
import { HomeController } from '../controllers/HomeController'
import { MerkleProofController } from '../controllers/MerkleProofController'
import { SearchController } from '../controllers/SearchController'
import { StateUpdateController } from '../controllers/StateUpdateController'
import { TransactionController } from '../controllers/TransactionController'
import { UserController } from '../controllers/UserController'
import { addPerpetualTradingRoutes } from './PerpetualFrontendRouter'
import { addSpotTradingRoutes } from './SpotFrontendRouter'
import { withTypedContext } from './types'
import { applyControllerResult, getGivenUser, getPagination } from './utils'

export function createFrontendRouter(
  homeController: HomeController,
  userController: UserController,
  stateUpdateController: StateUpdateController,
  transactionController: TransactionController,
  forcedActionController: ForcedActionController,
  merkleProofController: MerkleProofController,
  collateralAsset: CollateralAsset | undefined,
  tradingMode: TradingMode,
  searchController: SearchController
) {
  const router = new Router()

  router.get('/', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await homeController.getHomePage(givenUser)
    applyControllerResult(ctx, result)
  })

  router.get(
    '/search',
    withTypedContext(
      z.object({
        query: z.object({
          query: z.string(),
        }),
      }),
      async (ctx) => {
        const { query } = ctx.query
        const result = await searchController.getSearchRedirect(query)
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/state-updates',
    withTypedContext(
      z.object({
        query: z.object({
          page: z.optional(stringAsPositiveInt()),
          perPage: z.optional(stringAsPositiveInt()),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const pagination = getPagination(ctx.query)
        const result = await homeController.getHomeStateUpdatesPage(
          givenUser,
          pagination
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/forced-transactions',
    withTypedContext(
      z.object({
        query: z.object({
          page: z.optional(stringAsPositiveInt()),
          perPage: z.optional(stringAsPositiveInt()),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const pagination = getPagination(ctx.query)
        const result = await homeController.getHomeForcedTransactionsPage(
          givenUser,
          pagination
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/state-updates/:stateUpdateId',
    withTypedContext(
      z.object({
        params: z.object({
          stateUpdateId: stringAsPositiveInt(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result = await stateUpdateController.getStateUpdatePage(
          givenUser,
          ctx.params.stateUpdateId
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/state-updates/:stateUpdateId/balance-changes',
    withTypedContext(
      z.object({
        params: z.object({
          stateUpdateId: stringAsPositiveInt(),
        }),
        query: z.object({
          page: z.optional(stringAsPositiveInt()),
          perPage: z.optional(stringAsPositiveInt()),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const pagination = getPagination(ctx.query)
        const result =
          await stateUpdateController.getStateUpdateBalanceChangesPage(
            givenUser,
            ctx.params.stateUpdateId,
            pagination
          )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/state-updates/:stateUpdateId/transactions',
    withTypedContext(
      z.object({
        params: z.object({
          stateUpdateId: stringAsPositiveInt(),
        }),
        query: z.object({
          page: z.optional(stringAsPositiveInt()),
          perPage: z.optional(stringAsPositiveInt()),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const pagination = getPagination(ctx.query)
        const result =
          await stateUpdateController.getStateUpdateIncludedTransactionsPage(
            givenUser,
            ctx.params.stateUpdateId,
            pagination
          )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/users/:starkKey',
    withTypedContext(
      z.object({
        params: z.object({
          starkKey: stringAs(StarkKey),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result = await userController.getUserPage(
          givenUser,
          ctx.params.starkKey
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/users/:starkKey/assets',
    withTypedContext(
      z.object({
        params: z.object({
          starkKey: stringAs(StarkKey),
        }),
        query: z.object({
          page: z.optional(stringAsPositiveInt()),
          perPage: z.optional(stringAsPositiveInt()),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const pagination = getPagination(ctx.query)
        const result = await userController.getUserAssetsPage(
          givenUser,
          ctx.params.starkKey,
          pagination
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/users/:starkKey/balance-changes',
    withTypedContext(
      z.object({
        params: z.object({
          starkKey: stringAs(StarkKey),
        }),
        query: z.object({
          page: z.optional(stringAsPositiveInt()),
          perPage: z.optional(stringAsPositiveInt()),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const pagination = getPagination(ctx.query)
        const result = await userController.getUserBalanceChangesPage(
          givenUser,
          ctx.params.starkKey,
          pagination
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/users/:starkKey/transactions',
    withTypedContext(
      z.object({
        params: z.object({
          starkKey: z.string(),
        }),
        query: z.object({
          page: z.optional(stringAsPositiveInt()),
          perPage: z.optional(stringAsPositiveInt()),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const pagination = getPagination(ctx.query)
        const result = await userController.getUserTransactionsPage(
          givenUser,
          StarkKey(ctx.params.starkKey),
          pagination
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/users/:starkKey/offers',
    withTypedContext(
      z.object({
        params: z.object({
          starkKey: stringAs(StarkKey),
        }),
        query: z.object({
          page: z.optional(stringAsPositiveInt()),
          perPage: z.optional(stringAsPositiveInt()),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const pagination = getPagination(ctx.query)

        const result = await userController.getUserOffersPage(
          givenUser,
          ctx.params.starkKey,
          pagination
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/transactions/:transactionHash',
    withTypedContext(
      z.object({
        params: z.object({
          transactionHash: stringAs(Hash256),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result = await transactionController.getTransactionPage(
          givenUser,
          ctx.params.transactionHash
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/proof/:positionOrVaultId',
    withTypedContext(
      z.object({
        params: z.object({
          positionOrVaultId: stringAsBigInt(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)

        const result = await merkleProofController.getMerkleProofPage(
          givenUser,
          ctx.params.positionOrVaultId
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  if (tradingMode === 'perpetual') {
    addPerpetualTradingRoutes(router, forcedActionController, collateralAsset)
  } else {
    addSpotTradingRoutes(router, forcedActionController)
  }

  return router
}
