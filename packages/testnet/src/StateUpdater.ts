import {
  encodeOnChainData,
  FundingEntry,
  OnChainData,
  OraclePrice,
  PerpetualForcedAction,
  PositionUpdate,
  State,
} from '@explorer/encoding'
import {
  calculateUpdatedPositions,
  InMemoryMerkleStorage,
  MerkleTree,
  PositionLeaf,
} from '@explorer/state'
import {
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { solidityKeccak256 } from 'ethers/lib/utils'

import { Contracts } from './deployContracts'

export interface UpdateData {
  funding: FundingEntry[]
  positions: PositionUpdate[]
  forcedActions: PerpetualForcedAction[]
  prices: OraclePrice[]
}

export class StateUpdater {
  stateTree?: MerkleTree<PositionLeaf>
  lastState: State = {
    indices: [],
    oraclePrices: [],
    orderHeight: 64,
    orderRoot: PedersenHash.fake(),
    positionHeight: 64,
    positionRoot: PedersenHash.fake(),
    timestamp: Timestamp.now(),
    systemTime: Timestamp.now(),
  }

  constructor(private contracts: Contracts) {}

  async init() {
    const storage = new InMemoryMerkleStorage<PositionLeaf>()
    this.stateTree = await MerkleTree.create(storage, 64n, PositionLeaf.EMPTY)
    this.lastState.positionRoot = await this.stateTree.hash()
  }

  async registerUser(address: EthereumAddress, starkKey: StarkKey) {
    await this.contracts.perpetual.registerUser(
      address.toString(),
      starkKey.toString()
    )
    console.log(`Registered ${address.toString()} as ${starkKey.toString()}`)
  }

  async update(updateData: UpdateData) {
    if (!this.stateTree) {
      throw new Error('Not initialized!')
    }

    const newPositions = await calculateUpdatedPositions(this.stateTree, {
      oldState: this.lastState,
      funding: updateData.funding,
      positions: updateData.positions,
    })
    const nextStateTree = await this.stateTree.update(newPositions)
    this.stateTree = nextStateTree
    const afterRoot = await this.stateTree.hash()

    const oldState = this.lastState
    const newState: State = {
      indices: [],
      oraclePrices: updateData.prices,
      orderHeight: 64,
      orderRoot: PedersenHash.fake(),
      positionHeight: 64,
      positionRoot: afterRoot,
      timestamp: Timestamp.now(),
      systemTime: Timestamp.now(),
    }
    this.lastState = newState

    const onChainData: OnChainData = {
      assetConfigHashes: [],
      conditions: [],
      configurationHash: Hash256.fake(),
      forcedActions: updateData.forcedActions,
      minimumExpirationTimestamp: 1n,
      modifications: [],
      oldState,
      newState,
      funding: updateData.funding,
      positions: updateData.positions,
    }

    await this.performStateTransition(onChainData)
  }

  private async performStateTransition(onChainData: OnChainData) {
    const pages = encodeOnChainData(onChainData)

    const pageHashes: string[] = []
    for (const [i, page] of pages.entries()) {
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
      console.log(`Registered memory page ${i} of ${pages.length} ${hash}`)
    }

    const stateTransitionFact = `0x${PedersenHash.fake().toString()}`

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
