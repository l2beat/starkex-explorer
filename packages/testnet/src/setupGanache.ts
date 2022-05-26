import { providers } from 'ethers'
import ganache from 'ganache'

export async function setupGanache(keys: string[]) {
  const server = ganache.server({
    wallet: {
      lock: true,
      accounts: keys.map((secretKey) => ({
        balance: 1234n * 10n ** 18n,
        secretKey,
      })),
    },
    logging: {
      quiet: true,
    },
  })
  server.listen(8545)
  const provider = new providers.Web3Provider(
    server.provider as unknown as providers.ExternalProvider
  )
  return { provider, server }
}
