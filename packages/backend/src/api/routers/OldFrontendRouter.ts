import {
  stringAs,
  stringAsBigInt,
  stringAsInt,
  stringAsPositiveInt,
} from '@explorer/shared'
import { AssetId, EthereumAddress, Hash256 } from '@explorer/types'
import Router from '@koa/router'
import { Context } from 'koa'
import { z } from 'zod'

import { ForcedTransactionController } from '../controllers/ForcedTransactionController'
import { OldForcedTradeOfferController } from '../controllers/OldForcedTradeOfferController'
import { OldHomeController } from '../controllers/OldHomeController'
import { OldSearchController } from '../controllers/OldSearchController'
import { OldStateUpdateController } from '../controllers/OldStateUpdateController'
import { PositionController } from '../controllers/PositionController'
import { withTypedContext } from './types'
import { applyControllerResult } from './utils'

export function createOldFrontendRouter(
  positionController: PositionController,
  oldHomeController: OldHomeController,
  forcedTradeOfferController: OldForcedTradeOfferController,
  forcedTransactionController: ForcedTransactionController,
  stateUpdateController: OldStateUpdateController,
  searchController: OldSearchController
) {
  const router = new Router()

  router.get('/', async (ctx) => {
    const address = getAccountAddress(ctx)
    const result = await oldHomeController.getHomePage(address)
    applyControllerResult(ctx, result)
  })

  router.get(
    '/forced',
    withTypedContext(
      z.object({
        query: z.object({
          page: stringAsPositiveInt(1),
          perPage: stringAsPositiveInt(10),
        }),
      }),
      async (ctx) => {
        const { page, perPage } = ctx.query
        const address = getAccountAddress(ctx)
        const result =
          await forcedTransactionController.getForcedTransactionsPage(
            page,
            perPage,
            address
          )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get('/forced/new', async (ctx) => {
    const address = getAccountAddress(ctx)
    const result = await forcedTransactionController.getTransactionFormPage(
      address
    )
    applyControllerResult(ctx, result)
  })

  router.get(
    '/forced/offers',
    withTypedContext(
      z.object({
        query: z.object({
          page: stringAsPositiveInt(1),
          perPage: stringAsPositiveInt(10),
          assetId: stringAs(AssetId).optional(),
          type: z.enum(['sell', 'buy']).optional(),
        }),
      }),
      async (ctx) => {
        const { page, perPage, assetId, type } = ctx.query
        const address = getAccountAddress(ctx)
        const result = await forcedTradeOfferController.getOffersIndexPage({
          page,
          perPage,
          assetId,
          type,
          address,
        })
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/forced/offers/:id',
    withTypedContext(
      z.object({
        params: z.object({
          id: stringAsInt(),
        }),
      }),
      async (ctx) => {
        const { id } = ctx.params
        const address = getAccountAddress(ctx)
        const result = await forcedTradeOfferController.getOfferDetailsPage(
          id,
          address
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/forced/:hash',
    withTypedContext(
      z.object({
        params: z.object({
          hash: stringAs(Hash256),
        }),
      }),
      async (ctx) => {
        const { hash } = ctx.params
        const address = getAccountAddress(ctx)
        const result =
          await forcedTransactionController.getForcedTransactionDetailsPage(
            hash,
            address
          )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/state-updates',
    withTypedContext(
      z.object({
        query: z.object({
          page: stringAsPositiveInt(1),
          perPage: stringAsPositiveInt(10),
        }),
      }),
      async (ctx) => {
        const { page, perPage } = ctx.query
        const address = getAccountAddress(ctx)
        const result = await stateUpdateController.getStateUpdatesPage(
          page,
          perPage,
          address
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/state-updates/:id',
    withTypedContext(
      z.object({
        params: z.object({
          id: stringAsInt(),
        }),
      }),
      async (ctx) => {
        const { id } = ctx.params
        const address = getAccountAddress(ctx)
        const result = await stateUpdateController.getStateUpdateDetailsPage(
          id,
          address
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get('/positions/not-found', async (ctx) => {
    const address = getAccountAddress(ctx)
    const result = await positionController.getPositionNotFoundPage(address)
    applyControllerResult(ctx, result)
  })

  router.get(
    '/positions/:positionId',
    withTypedContext(
      z.object({
        params: z.object({
          positionId: stringAsBigInt(),
        }),
      }),
      async (ctx) => {
        const { positionId } = ctx.params
        const address = getAccountAddress(ctx)
        const result = await positionController.getPositionDetailsPage(
          positionId,
          address
        )
        applyControllerResult(ctx, result)
      }
    )
  )

  router.get(
    '/positions/:positionId/updates/:updateId',
    withTypedContext(
      z.object({
        params: z.object({
          positionId: stringAsBigInt(),
          updateId: stringAsInt(),
        }),
      }),
      async (ctx) => {
        const { positionId, updateId } = ctx.params
        const address = getAccountAddress(ctx)
        const result = await positionController.getPositionUpdatePage(
          positionId,
          updateId,
          address
        )
        applyControllerResult(ctx, result)
      }
    )
  )

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

  return router
}

export function getAccountAddress(ctx: Context) {
  const cookie = ctx.cookies.get('account')
  if (cookie) {
    try {
      return EthereumAddress(cookie)
    } catch {
      return
    }
  }
}
