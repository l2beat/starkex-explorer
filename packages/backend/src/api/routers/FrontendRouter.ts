import { UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import Router from '@koa/router'
import { Context } from 'koa'

import { HomeController } from '../controllers/HomeController'
import { applyControllerResult } from './utils'

export function createFrontendRouter(homeController: HomeController) {
  const router = new Router()

  router.get('/', async (ctx) => {
    const givenUser = getGivenUser(ctx)
    const result = await homeController.getHomePage(givenUser)
    applyControllerResult(ctx, result)
  })

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
