import { AssetId, EthereumAddress } from '@explorer/types'

import { ALICE_STARK_KEY, BOB_STARK_KEY, CHARLIE_STARK_KEY } from './constants'
import { deployContracts } from './deployContracts'
import { setupGanache } from './setupGanache'
import { setupWallets } from './setupWallets'
import { Simulation } from './Simulation'
import { StateUpdater } from './StateUpdater'

main()
async function main() {
  const { provider } = await setupGanache()
  const wallets = setupWallets(provider)
  const contracts = await deployContracts(wallets.deployer)

  console.log('Deployed contracts')

  const stateUpdater = new StateUpdater(contracts)
  await stateUpdater.init()
  const simulation = new Simulation(stateUpdater, [
    { assetId: AssetId('ETH-9'), priceUSDCents: 1_786_96n },
    { assetId: AssetId('BTC-10'), priceUSDCents: 28_967_70n },
    { assetId: AssetId('1INCH-7'), priceUSDCents: 92n },
    { assetId: AssetId('AAVE-8'), priceUSDCents: 93_41n },
    { assetId: AssetId('CRV-6'), priceUSDCents: 1_27n },
    { assetId: AssetId('DOGE-5'), priceUSDCents: 8n },
    { assetId: AssetId('LINK-7'), priceUSDCents: 6_50n },
    { assetId: AssetId('SOL-7'), priceUSDCents: 42_11n },
  ])

  await simulation.addUser(
    EthereumAddress(wallets.alice.address),
    ALICE_STARK_KEY
  )
  await simulation.addUser(EthereumAddress(wallets.bob.address), BOB_STARK_KEY)
  await simulation.addUser(
    EthereumAddress(wallets.charlie.address),
    CHARLIE_STARK_KEY
  )

  await simulation.update()
  setInterval(async () => {
    await simulation.update()
  }, 60 * 1000)
}
