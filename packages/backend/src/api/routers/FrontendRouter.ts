import { ignoreReactSelectWarning } from '@explorer/frontend'
import { stringAsPositiveInt, UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import Router from '@koa/router'
import { Context } from 'koa'
import * as z from 'zod'

import { PaginationOptions } from '../../model/PaginationOptions'
import { HomeController } from '../controllers/HomeController'
import { withTypedContext } from './types'
import { applyControllerResult } from './utils'

export function createFrontendRouter(homeController: HomeController) {
  ignoreReactSelectWarning()

  const router = new Router()

  router.get('/', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await homeController.getHomePage(givenUser)
    applyControllerResult(ctx, result)
  })

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
        const result = await homeController.getHomeStateUpdatesPage(
          givenUser,
          pagination
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
