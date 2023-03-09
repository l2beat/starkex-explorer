import {
  stringAsBigInt,
  stringAsPositiveInt,
  UserDetails,
} from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey } from '@explorer/types'
import Router from '@koa/router'
import { Context } from 'koa'
import * as z from 'zod'

import { PaginationOptions } from '../../model/PaginationOptions'
import { HomeController } from '../controllers/HomeController'
import { MerkleProofController } from '../controllers/MerkleProofController'
import { SearchController } from '../controllers/SearchController'
import { SpotForcedWithdrawalController } from '../controllers/SpotForcedWithdrawalController'
import { StateUpdateController } from '../controllers/StateUpdateController'
import { TransactionController } from '../controllers/TransactionController'
import { UserController } from '../controllers/UserController'
import { withTypedContext } from './types'
import { applyControllerResult } from './utils'

export function createFrontendRouter(
  homeController: HomeController,
  userController: UserController,
  stateUpdateController: StateUpdateController,
  transactionController: TransactionController,
  spotForcedWithdrawalController: SpotForcedWithdrawalController,
  merkleProofController: MerkleProofController,
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
          starkKey: z.string(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result = await userController.getUserPage(
          givenUser,
          StarkKey(ctx.params.starkKey)
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
        const result = await userController.getUserAssetsPage(
          givenUser,
          StarkKey(ctx.params.starkKey),
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
        const result = await userController.getUserBalanceChangesPage(
          givenUser,
          StarkKey(ctx.params.starkKey),
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
    '/transactions/:transactionHash',
    withTypedContext(
      z.object({
        params: z.object({
          transactionHash: z.string(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result = await transactionController.getTransactionPage(
          givenUser,
          Hash256(ctx.params.transactionHash)
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/forced/new/spot/:vaultId',
    withTypedContext(
      z.object({
        params: z.object({
          vaultId: stringAsBigInt(),
        }),
      }),
      async (ctx) => {
        const givenUser = getGivenUser(ctx)
        const result =
          await spotForcedWithdrawalController.getSpotForcedWithdrawalPage(
            givenUser,
            ctx.params.vaultId
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

  return router
}

function getGivenUser(ctx: Context): Partial<UserDetails> {
  const account = ctx.cookies.get('account')
  const starkKey = ctx.cookies.get('starkKey')
  if (account) {
    try {
      return {
        address: EthereumAddress(account),
        starkKey: starkKey ? StarkKey(starkKey) : undefined,
      }
    } catch {
      return {}
    }
  }
  return {}
}

function getPagination(query: {
  page?: number
  perPage?: number
}): PaginationOptions {
  const page = Math.max(1, query.page ?? 1)
  const perPage = Math.max(1, Math.min(200, query.perPage ?? 50))
  return {
    limit: perPage,
    offset: (page - 1) * perPage,
  }
}
