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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      params: ctx.params,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      query: ctx.query,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      request: ctx.request,
    })
    if (!parseResult.success) {
      ctx.status = 400
      ctx.body = { issues: parseResult.error.issues }
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    ctx.params = parseResult.data.params
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    ctx.request.body = parseResult.data.request?.body
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Object.defineProperty(ctx, 'query', { value: parseResult.data.query })
    await handler(ctx)
  }
}
