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

export function withRequestDataParsing<T extends z.AnyZodObject>(
  parser: T,
  handler: (
    ctx: Application.ParameterizedContext,
    data: z.infer<T>
  ) => Promise<void>
) {
  return async (_ctx: Application.ParameterizedContext) => {
    const parseResult = parser.safeParse({
      body: _ctx.body,
      params: _ctx.params,
      query: _ctx.query,
    })
    if (!parseResult.success) {
      _ctx.status = 400
      _ctx.body = { issues: parseResult.error.issues }
      return
    }
    await handler(_ctx, parseResult.data)
  }
}
