import { Context } from 'koa'
import { z } from 'zod'

export function stringAsInt(fallback?: number) {
  return z.preprocess((s) => {
    const res = z.string().safeParse(s)
    return res.success && s !== '' ? Number(res.data) : fallback
  }, z.number().int())
}
export function stringAsBigInt(fallback?: bigint) {
  return stringAs(BigInt, fallback)
}

export function stringAs<T>(brandedType: (value: string) => T, fallback?: T) {
  return z
    .string()
    .refine((v) => {
      try {
        brandedType(v)
        return true
      } catch {
        if (!fallback) {
          return false
        }
        return fallback
      }
    })
    .transform(brandedType)
}

export type TypedContext<T> = Omit<Context, 'params' | 'query'> & T

export function withTypedContext<T extends z.AnyZodObject>(
  parser: T,
  handler: (ctx: TypedContext<z.infer<T>>) => Promise<void>
) {
  return async (ctx: Context) => {
    const parseResult = parser.safeParse({
      params: ctx.params,
      query: ctx.query,
    })
    if (!parseResult.success) {
      ctx.status = 400
      ctx.body = { issues: parseResult.error.issues }
      return
    }
    ctx.params = parseResult.data.params
    ctx.query = parseResult.data.query
    await handler(ctx)
  }
}
