import { encodeOnChainData, OnChainData, State } from '@explorer/encoding'
import {
  InMemoryRollupStorage,
  OnChainUpdate,
  RollupState,
} from '@explorer/state'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { solidityKeccak256 } from 'ethers/lib/utils'
import { Contracts } from './deployContracts'

export class StateUpdater {
  rollup?: RollupState
  lastState: State = {
    indices: [],
    oraclePrices: [],
    orderHeight: 64,
    orderRoot: PedersenHash.fake(),
    positionHeight: 64,
    positionRoot: PedersenHash.fake(),
    timestamp: Timestamp(Date.now()),
    systemTime: Timestamp(Date.now()),
  }

  constructor(private contracts: Contracts) {}

  async init() {
    const storage = new InMemoryRollupStorage()
    this.rollup = await RollupState.empty(storage)
    this.lastState.positionRoot = await this.rollup.positions.hash()
  }

  async update(data: OnChainUpdate) {
    if (!this.rollup) {
      throw new Error('Not initialized!')
    }

    this.rollup = (await this.rollup.update(data))[0]
    const afterRoot = await this.rollup.positions.hash()

    const newState: State = {
      indices: [],
      oraclePrices: [],
      orderHeight: 64,
      orderRoot: PedersenHash.fake(),
      positionHeight: 64,
      positionRoot: afterRoot,
      timestamp: Timestamp(Date.now()),
      systemTime: Timestamp(Date.now()),
    }

    const onChainData: OnChainData = {
      assetConfigHashes: [],
      conditions: [],
      configurationHash: Hash256.fake(),
      forcedActions: [],
      minimumExpirationTimestamp: 1n,
      modifications: [],
      oldState: this.lastState,
      newState,
      ...data,
    }

    this.lastState = newState

    const encoded = encodeOnChainData(onChainData)

    const pageHashes: string[] = []
    for (const [i, page] of encoded.entries()) {
      const values: bigint[] = []
      for (let i = 0; i < page.length / 2 / 32; i++) {
        values.push(BigInt('0x' + page.slice(64 * i, 64 * (i + 1))))
      }

      const hash = solidityKeccak256(['uint256[]'], [values])
      pageHashes.push(hash)
      await this.contracts.registry.registerContinuousMemoryPage(
        0,
        values,
        0,
        0,
        0
      )
      console.log(`Registered memory page ${i} of ${encoded.length} ${hash}`)
    }

    const stateTransitionFact = '0x' + PedersenHash.fake()

    await this.contracts.verifier.emitLogMemoryPagesHashes(
      stateTransitionFact,
      pageHashes
    )
    console.log(`Registered mapping ${stateTransitionFact}`)

    await this.contracts.perpetual.emitLogStateTransitionFact(
      stateTransitionFact
    )
    console.log(`Registered state transition ${stateTransitionFact}`)
  }
}
