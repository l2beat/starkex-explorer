import { z, ZodTypeAny } from 'zod'

function preprocessStringAsNumber<T extends ZodTypeAny>(
  finalType: T,
  fallback?: number
) {
  return z.preprocess((s) => {
    const res = z.string().safeParse(s)
    return res.success && s !== '' ? Number(res.data) : fallback
  }, finalType)
}

export function stringAsInt(fallback?: number) {
  return preprocessStringAsNumber(z.number().int(), fallback)
}

export function stringAsPositiveInt(fallback?: number) {
  return preprocessStringAsNumber(z.number().int().positive(), fallback)
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

export function stringAsBoolean() {
  return z.preprocess(
    (v) =>
      z
        .enum(['true', 'false'])
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        .transform((v) => JSON.parse(v))
        .parse(v),
    z.boolean()
  )
}

export function numberAs<T>(Brand: (n: number | bigint) => T) {
  return z
    .number()
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
