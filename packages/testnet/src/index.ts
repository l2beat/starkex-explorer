import { encodeOnChainData, OnChainData } from '@explorer/encoding'
import {
  InMemoryRollupStorage,
  OnChainUpdate,
  RollupState,
} from '@explorer/state'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { solidityKeccak256 } from 'ethers/lib/utils'

import {
  ALICE_POSITION,
  ALICE_STARK_KEY,
  BOB_STARK_KEY,
  CHARLIE_STARK_KEY,
} from './constants'
import { deployContracts } from './deployContracts'
import { setupGanache } from './setupGanache'
import { setupWallets } from './setupWallets'

main()
async function main() {
  const { provider } = await setupGanache()
  const wallets = setupWallets(provider)
  const contracts = await deployContracts(wallets.deployer)
  console.log('--- FINISHED DEPLOYING CONTRACTS ---')

  const storage = new InMemoryRollupStorage()

  let rollup = await RollupState.empty(storage)
  const initialRoot = await rollup.positions.hash()
  const update: OnChainUpdate = {
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
  }
  ;[rollup] = await rollup.update(update)
  const afterRoot = await rollup.positions.hash()

  const onChainData: OnChainData = {
    assetConfigHashes: [],
    conditions: [],
    configurationHash: Hash256.fake(),
    forcedActions: [],
    minimumExpirationTimestamp: 1n,
    modifications: [],
    oldState: {
      indices: [],
      oraclePrices: [],
      orderHeight: 64,
      orderRoot: PedersenHash.fake(),
      positionHeight: 64,
      positionRoot: initialRoot,
      timestamp: Timestamp(0),
      systemTime: Timestamp(0),
    },
    newState: {
      indices: [],
      oraclePrices: [],
      orderHeight: 64,
      orderRoot: PedersenHash.fake(),
      positionHeight: 64,
      positionRoot: afterRoot,
      timestamp: Timestamp(0),
      systemTime: Timestamp(0),
    },
    ...update,
  }
  const encoded = encodeOnChainData(onChainData)

  await contracts.perpetual.registerUser(wallets.alice.address, ALICE_STARK_KEY)
  await contracts.perpetual.registerUser(wallets.bob.address, BOB_STARK_KEY)
  await contracts.perpetual.registerUser(
    wallets.charlie.address,
    CHARLIE_STARK_KEY
  )

  const pageHashes: string[] = []
  for (const page of encoded) {
    const values: bigint[] = []
    for (let i = 0; i < page.length / 2 / 32; i++) {
      values.push(BigInt('0x' + page.slice(64 * i, 64 * (i + 1))))
    }

    const hash = solidityKeccak256(['uint256[]'], [values])
    pageHashes.push(hash)
    await contracts.registry.registerContinuousMemoryPage(0, values, 0, 0, 0)
  }

  const stateTransitionFact = '0x' + PedersenHash.fake()

  await contracts.verifier.emitLogMemoryPagesHashes(
    stateTransitionFact,
    pageHashes
  )

  await contracts.perpetual.emitLogStateTransitionFact(stateTransitionFact)
  console.log('--- FINISHED STATE TRANSITION ---')
}
