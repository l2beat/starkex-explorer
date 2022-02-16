import { PedersenHash } from '@explorer/crypto'
import { decodeOnChainData as _decodeOnChainData } from '@explorer/encoding'
import { Position, RollupState } from '@explorer/state'

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
    const stateTransitions = await this.pageRepository.getAllForFacts(
      stateTransitionFacts.map((f) => f.hash)
    )

    let { oldHash, id } = await this.readLastUpdate()
    let rollupState = await this.ensureRollupState(oldHash)

    let i = 0
    for (const { factHash, pages } of stateTransitions) {
      const blockNumber = stateTransitionFacts[i].blockNumber

      const { timestamp } = await this.ethereumClient.getBlock(blockNumber)

      const decoded = this.decodeOnChainData(pages)

      let newPositions: { index: bigint; value: Position }[]
      ;[rollupState, newPositions] = await rollupState.update(decoded)
      this.rollupState = rollupState

      const rootHash = await rollupState.positions.hash()
      await this.stateUpdateRepository.add({
        stateUpdate: {
          id: ++id,
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

      i++
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.stateUpdateRepository.deleteAllAfter(blockNumber)
  }

  private async readLastUpdate() {
    let oldHash: PedersenHash
    let id: number

    const lastUpdate = await this.stateUpdateRepository.getLast()

    if (lastUpdate) {
      ;({ rootHash: oldHash, id } = lastUpdate)
    } else {
      oldHash = ROLLUP_STATE_EMPTY_HASH
      id = 0
    }

    return { oldHash, id }
  }

  private async ensureRollupState(oldHash: PedersenHash) {
    if (!this.rollupState) {
      this.rollupState = RollupState.recover(
        this.rollupStateRepository,
        oldHash
      )
    } else if ((await this.rollupState.positions.hash()) !== oldHash) {
      this.rollupState = RollupState.recover(
        this.rollupStateRepository,
        oldHash
      )
    }
    return this.rollupState
  }
}
