import { z } from 'zod'

export type InstanceName = z.infer<typeof InstanceName>
export const InstanceName = z.union([
  z.literal('dYdX'),
  z.literal('Myria'),
  z.literal('GammaX'),
])

export function getInstanceName(): InstanceName {
  const projectName = process.env.STARKEX_INSTANCE ?? 'dydx-mainnet'

  switch (projectName) {
    case 'dydx-mainnet':
      return 'dYdX'
    case 'myria-goerli':
      return 'Myria'
    case 'gammax-goerli':
      return 'GammaX'
    default:
      throw new Error(`Unknown STARKEX_INSTANCE: ${projectName}`)
  }
}
