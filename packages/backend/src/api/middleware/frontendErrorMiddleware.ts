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

  // Koa sets status to 200 if you set body to non nullish value, so we need to overwrite ctx.status after setting body
  const statusCode = ctx.status
  switch (statusCode) {
    case 400:
    case 404:
      ctx.set({ 'Content-Type': 'text/html' })
      ctx.body = renderErrorPage({
        context,
        statusCode,
        message: ctx.customMessage as string,
      })
      ctx.status = statusCode
      break
    case 500:
      ctx.set({ 'Content-Type': 'text/html' })
      ctx.body = renderErrorPage({
        context,
        statusCode,
      })
      ctx.status = statusCode
      break
  }
}
