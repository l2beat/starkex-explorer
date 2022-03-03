import { Context } from 'koa'
import { z } from 'zod'

export function stringToPositiveInt(fallback?: string) {
  return z.preprocess(
    (s) => Number(z.string().parse(s ?? fallback)),
    z.number().int().positive()
  )
}

export function brandedString<T>(brandedType: (value: string) => T) {
  return z
    .string()
    .refine((v) => {
      try {
        brandedType(v)
        return true
      } catch {
        return false
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
