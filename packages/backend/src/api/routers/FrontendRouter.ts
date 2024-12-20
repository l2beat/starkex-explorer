import { stringAs, stringAsBigInt, stringAsPositiveInt } from '@explorer/shared'
import { Hash256, StarkKey } from '@explorer/types'
import Router from '@koa/router'
import * as z from 'zod'

import { Config } from '../../config'
import { EscapeHatchController } from '../controllers/EscapeHatchController'
import { ForcedActionController } from '../controllers/ForcedActionController'
import { ForcedTradeOfferController } from '../controllers/ForcedTradeOfferController'
import { HomeController } from '../controllers/HomeController'
import { L2TransactionController } from '../controllers/L2TransactionController'
import { MerkleProofController } from '../controllers/MerkleProofController'
import { SearchController } from '../controllers/SearchController'
import { StateUpdateController } from '../controllers/StateUpdateController'
import { StaticPageController } from '../controllers/StaticPageController'
import { TransactionController } from '../controllers/TransactionController'
import { TutorialController } from '../controllers/TutorialController'
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
  forcedTradeOfferController: ForcedTradeOfferController | undefined,
  merkleProofController: MerkleProofController,
  searchController: SearchController,
  l2TransactionController: L2TransactionController,
  escapeHatchController: EscapeHatchController,
  tutorialController: TutorialController,
  staticPageController: StaticPageController,
  config: Config
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
    '/state-updates/:stateUpdateId/l2-transactions',
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
          await stateUpdateController.getStateUpdateL2TransactionsPage(
            givenUser,
            ctx.params.stateUpdateId,
            pagination
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

  router.get('/users/register', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await userController.getUserRegisterPage(givenUser)

    applyControllerResult(ctx, result)
  })

  router.get('/users/recover', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await userController.getUserRecoverPage(givenUser)

    applyControllerResult(ctx, result)
  })

  router.get('/users/not-associated', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await staticPageController.getUserNotAssociatedPage(
      givenUser
    )

    applyControllerResult(ctx, result)
  })

  router.get(
    '/users/:starkKey',
    withTypedContext(
      z.object({
        params: z.object({
          starkKey: stringAs(StarkKey),
        }),
        query: z.object({
          performUserActions: z
            .string()
            .transform((value) => value === 'true')
            .optional(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result = await userController.getUserPage(
          givenUser,
          ctx.params.starkKey,
          ctx.query.performUserActions
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

  router.get('/freeze', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await escapeHatchController.getFreezeRequestActionPage(
      givenUser
    )
    applyControllerResult(ctx, result)
  })

  router.get(
    '/escape/:positionOrVaultId',
    withTypedContext(
      z.object({
        params: z.object({
          positionOrVaultId: stringAsBigInt(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)

        const result = await escapeHatchController.getEscapeHatchActionPage(
          givenUser,
          ctx.params.positionOrVaultId
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get('/freeze', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await escapeHatchController.getFreezeRequestActionPage(
      givenUser
    )
    applyControllerResult(ctx, result)
  })

  router.get(
    '/escape/:positionOrVaultId',
    withTypedContext(
      z.object({
        params: z.object({
          positionOrVaultId: stringAsBigInt(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)

        const result = await escapeHatchController.getEscapeHatchActionPage(
          givenUser,
          ctx.params.positionOrVaultId
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  if (config.starkex.l2Transactions.enabled) {
    router.get(
      '/l2-transactions',
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
          const result = await homeController.getHomeL2TransactionsPage(
            givenUser,
            pagination
          )
          applyControllerResult(ctx, result)
        }
      )
    )

    router.get(
      '/users/:starkKey/l2-transactions',
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
          const result = await userController.getUserL2TransactionsPage(
            givenUser,
            ctx.params.starkKey,
            pagination
          )
          applyControllerResult(ctx, result)
        }
      )
    )
  }
  router.get('/tutorials', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await tutorialController.getTutorialsPage(givenUser)
    applyControllerResult(ctx, result)
  })

  router.get(
    '/tutorials/:slug',
    withTypedContext(
      z.object({
        params: z.object({
          slug: z.string(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result = await tutorialController.getTutorialPage(
          givenUser,
          ctx.params.slug
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get('/metamask-required', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await staticPageController.getInstallMetaMaskPage(givenUser)
    applyControllerResult(ctx, result)
  })

  if (config.starkex.tradingMode === 'perpetual') {
    if (!forcedTradeOfferController) {
      throw new Error(
        'forcedTradeOfferController is required in perpetual trading mode'
      )
    }

    addPerpetualTradingRoutes(
      router,
      homeController,
      forcedTradeOfferController,
      forcedActionController,
      l2TransactionController,
      config
    )
  } else {
    addSpotTradingRoutes(router, forcedActionController)
  }

  return router
}
