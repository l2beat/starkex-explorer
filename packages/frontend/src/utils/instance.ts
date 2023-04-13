export type InstanceName = 'dYdX' | 'Myria' | 'GammaX'

export function getInstanceName(): InstanceName {
  const projectName = process.env.STARKEX_INSTANCE ?? 'dydx-mainnet'

  switch (projectName) {
    case 'dydx-mainnet':
    case 'dydx-local':
      return 'dYdX'
    case 'myria-goerli':
      return 'Myria'
    case 'gammax-goerli':
      return 'GammaX'
    default:
      throw new Error(`Unknown STARKEX_INSTANCE: ${projectName}`)
  }
}
