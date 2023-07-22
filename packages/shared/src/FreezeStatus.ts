import { z } from 'zod'

export type FreezeStatus = z.infer<typeof FreezeStatus>
export const FreezeStatus = z.union([
  z.literal('not-frozen'),
  z.literal('freezable'),
  z.literal('frozen'),
])
