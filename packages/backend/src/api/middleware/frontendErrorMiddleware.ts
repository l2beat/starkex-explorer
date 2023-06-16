import { renderErrorPage } from '@explorer/frontend'
import { Context, Next } from 'koa'

import { PageContextService } from '../../core/PageContextService'
import { getGivenUser } from '../routers/utils'

export async function frontendErrorMiddleware(
  ctx: Context,
  next: Next,
  pageContextService: PageContextService
) {
  await next()

  const givenUser = getGivenUser(ctx)
  const context = await pageContextService.getPageContext(givenUser)
  ctx.set({ 'Content-Type': 'text/html' })

  switch (ctx.status) {
    case 400:
    case 404:
      ctx.body = renderErrorPage({
        context,
        statusCode: ctx.status,
        message: ctx.customMessage,
      })
      break
    case 500:
      ctx.body = renderErrorPage({
        context,
        statusCode: ctx.status,
      })
      break
    default:
      break
  }
}
