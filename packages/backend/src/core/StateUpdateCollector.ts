import { PedersenHash } from '@explorer/crypto'
import { decodeOnChainData as _decodeOnChainData } from '@explorer/encoding'
import { RollupState } from '@explorer/state'

import { Hash256 } from '../model'
import { PageRepository } from '../peripherals/database/PageRepository'
import { RollupStateRepository } from '../peripherals/database/RollupStateRepository'
import { StateTransitionFactRecord } from '../peripherals/database/StateTransitionFactsRepository'
import {
  PositionRecord,
  StateUpdateRepository,
} from '../peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'

/**
 * @internal
 * Same as `await RollupState.empty().then(empty => empty.positions.hash())`
 */
export const ROLLUP_STATE_EMPTY_HASH = PedersenHash(
  '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
)

interface StateTransition {
  blockNumber: number
  factHash: Hash256
  pages: string[]
}

export class StateUpdateCollector {
  private rollupState?: RollupState

  constructor(
    private readonly pageRepository: PageRepository,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly rollupStateRepository: RollupStateRepository,
    private readonly ethereumClient: EthereumClient,
    private readonly decodeOnChainData = _decodeOnChainData
  ) {}

  async save(stateTransitionFacts: StateTransitionFactRecord[]) {
    if (stateTransitionFacts.length === 0) {
      return
    }

    const dbTransitions = await this.pageRepository.getAllForFacts(
      stateTransitionFacts.map((f) => f.hash)
    )
    const stateTransitions = dbTransitions.map((x, i) => ({
      ...x,
      blockNumber: stateTransitionFacts[i].blockNumber,
    }))

    const { oldHash, id } = await this.readLastUpdate()
    await this.ensureRollupState(oldHash)

    for (const [i, stateTransition] of stateTransitions.entries()) {
      await this.processStateTransition(stateTransition, id + i + 1)
    }
  }

  async processStateTransition(
    { pages, factHash, blockNumber }: StateTransition,
    id: number
  ) {
    if (!this.rollupState) {
      return
    }
    const { timestamp } = await this.ethereumClient.getBlock(blockNumber)

    const decoded = this.decodeOnChainData(pages)

    const [rollupState, newPositions] = await this.rollupState.update(decoded)
    this.rollupState = rollupState

    const rootHash = await rollupState.positions.hash()
    await this.stateUpdateRepository.add({
      stateUpdate: {
        id,
        blockNumber,
        factHash,
        rootHash,
        timestamp,
      },
      positions: newPositions.map(
        ({ value, index }): PositionRecord => ({
          positionId: index,
          publicKey: value.publicKey,
          balances: value.assets,
          collateralBalance: value.collateralBalance,
        })
      ),
      prices: decoded.newState.oraclePrices,
    })
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.stateUpdateRepository.deleteAllAfter(blockNumber)
  }

  private async readLastUpdate() {
    const lastUpdate = await this.stateUpdateRepository.getLast()
    if (lastUpdate) {
      return { oldHash: lastUpdate.rootHash, id: lastUpdate.id }
    }
    return { oldHash: ROLLUP_STATE_EMPTY_HASH, id: 0 }
  }

  async ensureRollupState(oldHash: PedersenHash) {
    if (!this.rollupState) {
      if (oldHash === ROLLUP_STATE_EMPTY_HASH) {
        this.rollupState = await RollupState.empty(this.rollupStateRepository)
      } else {
        this.rollupState = RollupState.recover(
          this.rollupStateRepository,
          oldHash
        )
      }
    } else if ((await this.rollupState.positions.hash()) !== oldHash) {
      this.rollupState = RollupState.recover(
        this.rollupStateRepository,
        oldHash
      )
    }
    return this.rollupState
  }
}
