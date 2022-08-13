import { providers } from 'ethers'
import ganache from 'ganache'

import { PRIVATE_KEYS } from './constants'

export async function setupGanache() {
  const server = ganache.server({
    wallet: {
      lock: true,
      accounts: PRIVATE_KEYS.map((secretKey) => ({
        balance: 1234n * 10n ** 18n,
        secretKey,
      })),
    },
    logging: {
      quiet: true,
    },
  })
  try {
    await server.listen(8545)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
  const provider = new providers.Web3Provider(
    server.provider as unknown as providers.ExternalProvider
  )
  return { provider, server }
}
