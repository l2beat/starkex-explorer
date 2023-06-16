import { renderNotFoundPage } from '@explorer/frontend'
import { Context, Next } from 'koa'

import { PageContextService } from '../../core/PageContextService'
import { getGivenUser } from '../routers/utils'

export async function notFoundMiddleware(
  ctx: Context,
  next: Next,
  pageContextService: PageContextService
) {
  await next()
  if (ctx.response.status === 404) {
    const givenUser = getGivenUser(ctx)
    const context = await pageContextService.getPageContext(givenUser)
    ctx.response.body = renderNotFoundPage({
      context,
      message: ctx.message,
    })
  }
}
