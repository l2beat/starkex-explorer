import Application from 'koa'
import { z } from 'zod'

export function stringToPositiveInt(def: string) {
  return z.preprocess(
    (s) => parseInt(z.string().parse(s || def), 10),
    z.number().positive()
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

export type TypedContext<T> = Omit<
  Application.ParameterizedContext,
  'body' | 'params' | 'query'
> &
  T

export function withTypedContext<T extends z.AnyZodObject>(
  parser: T,
  handler: (ctx: TypedContext<z.infer<T>>) => Promise<void>
) {
  return async (ctx: Application.ParameterizedContext) => {
    const parseResult = parser.safeParse({
      body: ctx.body,
      params: ctx.params,
      query: ctx.query,
    })
    if (!parseResult.success) {
      ctx.status = 400
      ctx.body = { issues: parseResult.error.issues }
      return
    }
    ctx.body = parseResult.data.body
    ctx.params = parseResult.data.params
    ctx.query = parseResult.data.query
    await handler(ctx)
  }
}
