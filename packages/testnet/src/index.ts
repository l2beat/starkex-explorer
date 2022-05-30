import { AssetId, Timestamp } from '@explorer/types'

import {
  ALICE_POSITION,
  ALICE_STARK_KEY,
  BOB_POSITION,
  BOB_STARK_KEY,
  CHARLIE_STARK_KEY,
} from './constants'
import { deployContracts } from './deployContracts'
import { setupGanache } from './setupGanache'
import { setupWallets } from './setupWallets'
import { StateUpdater } from './StateUpdater'

main()
async function main() {
  const { provider } = await setupGanache()
  const wallets = setupWallets(provider)
  const contracts = await deployContracts(wallets.deployer)

  console.log('Deployed contracts')

  await contracts.perpetual.registerUser(wallets.alice.address, ALICE_STARK_KEY)
  await contracts.perpetual.registerUser(wallets.bob.address, BOB_STARK_KEY)
  await contracts.perpetual.registerUser(
    wallets.charlie.address,
    CHARLIE_STARK_KEY
  )

  console.log('Registered users')

  const stateUpdater = new StateUpdater(contracts)
  await stateUpdater.init()

  console.log('Initialized state')

  await stateUpdater.update({
    funding: [
      {
        indices: [],
        timestamp: Timestamp.fromSeconds(100),
      },
    ],
    positions: [
      {
        positionId: ALICE_POSITION,
        collateralBalance: 20000n * 10n ** 6n,
        fundingTimestamp: Timestamp.fromSeconds(100),
        publicKey: ALICE_STARK_KEY,
        balances: [],
      },
    ],
  })

  await stateUpdater.update({
    funding: [
      {
        indices: [{ assetId: AssetId('BTC-10'), value: 1234n }],
        timestamp: Timestamp.fromSeconds(200),
      },
    ],
    positions: [
      {
        positionId: ALICE_POSITION,
        collateralBalance: 30000n * 10n ** 6n,
        fundingTimestamp: Timestamp.fromSeconds(200),
        publicKey: ALICE_STARK_KEY,
        balances: [],
      },
      {
        positionId: BOB_POSITION,
        collateralBalance: 10000n * 10n ** 6n,
        fundingTimestamp: Timestamp.fromSeconds(200),
        publicKey: BOB_STARK_KEY,
        balances: [{ assetId: AssetId('BTC-10'), balance: 123456789n }],
      },
    ],
  })
}
