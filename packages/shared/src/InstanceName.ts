import { z } from 'zod'

export type InstanceName = z.infer<typeof InstanceName>
export const InstanceName = z.union([
  z.literal('dYdX'),
  z.literal('Myria'),
  z.literal('GammaX'),
])
