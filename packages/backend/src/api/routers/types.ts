import { Context } from 'koa'
import { z } from 'zod'

export function stringAsInt(fallback?: number) {
  return z.preprocess((s) => {
    const res = z.string().safeParse(s)
    return res.success && s !== '' ? Number(res.data) : fallback
  }, z.number().int())
}
export function stringAsBigInt(fallback?: bigint) {
  return z.preprocess((v) => {
    try {
      const s = z.string().parse(v)
      if (s === '') return fallback
      return BigInt(s)
    } catch {
      return fallback
    }
  }, z.bigint())
}
export function stringAs<T>(Brand: (s: string) => T) {
  return z
    .string()
    .refine((s) => {
      try {
        Brand(s)
        return true
      } catch {
        return false
      }
    })
    .transform(Brand)
}

export function withTypedContext<T extends z.AnyZodObject>(
  parser: T,
  handler: (ctx: Context & z.infer<T>) => Promise<void>
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
    ctx.request.body = parseResult.data.request.body
    await handler(ctx)
  }
}
