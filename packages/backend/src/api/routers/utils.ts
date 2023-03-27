import { assertUnreachable, UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import { Context } from 'koa'

import { PaginationOptions } from '../../model/PaginationOptions'
import { ControllerResult } from '../controllers/ControllerResult'

export function applyControllerResult(ctx: Context, result: ControllerResult) {
  switch (result.type) {
    case 'redirect':
      ctx.redirect(result.url)
      return
    case 'success':
      ctx.status = 200
      break
    case 'created':
      ctx.status = 201
      break
    case 'bad request':
      ctx.status = 400
      break
    case 'not found':
      ctx.status = 404
      break
    default:
      assertUnreachable(result)
  }
  ctx.body = result.content
}

export function getGivenUser(ctx: Context): Partial<UserDetails> {
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

export function getPagination(query: {
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
