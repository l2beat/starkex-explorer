import { Context } from 'koa'

import { ControllerResult } from '../controllers/ControllerResult'

export function applyControllerResult(ctx: Context, result: ControllerResult) {
  if (result.type === 'redirect') {
    ctx.redirect(result.url)
  } else {
    if (result.type === 'success') {
      ctx.status = 200
    } else if (result.type === 'created') {
      ctx.status = 201
    } else if (result.type === 'bad request') {
      ctx.status = 400
    } else if (result.type === 'not found') {
      ctx.status = 404
    }
    ctx.body = result.content
  }
}
