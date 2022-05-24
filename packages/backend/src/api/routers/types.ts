import { Context, Request } from 'koa'
import { z } from 'zod'

interface ParsedRequest extends Request {
  body?: unknown
}

interface ParsedContext extends Context {
  request: ParsedRequest
}

export function withTypedContext<T extends z.AnyZodObject>(
  parser: T,
  handler: (ctx: ParsedContext & z.infer<T>) => Promise<void>
) {
  return async (ctx: Context) => {
    const parseResult = parser.safeParse({
      params: ctx.params,
      query: ctx.query,
      request: ctx.request,
    })
    if (!parseResult.success) {
      ctx.status = 400
      ctx.body = { issues: parseResult.error.issues }
      return
    }
    ctx.params = parseResult.data.params
    ctx.query = parseResult.data.query
    ctx.request.body = parseResult.data.request?.body
    await handler(ctx)
  }
}
