import {
  ForcedAction,
  OnChainData,
  StarkExProgramOutput,
} from '@explorer/encoding'
import { FundingByTimestamp, Position, RollupState } from '@explorer/state'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'

import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { PageRepository } from '../peripherals/database/PageRepository'
import { PositionRecord } from '../peripherals/database/PositionRepository'
import { RollupStateRepository } from '../peripherals/database/RollupStateRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'

/**
 * @internal
 * Same as `await RollupState.empty().then(empty => empty.positions.hash())`
 */
export const ROLLUP_STATE_EMPTY_HASH = PedersenHash(
  '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
)

export class StateUpdater {
  constructor(
    private readonly pageRepository: PageRepository,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly rollupStateRepository: RollupStateRepository,
    private readonly ethereumClient: EthereumClient,
    private readonly forcedTransactionsRepository: ForcedTransactionsRepository,
    private readonly logger: Logger,
    private rollupState?: RollupState
  ) {}

  async loadRequiredPages(
    stateTransitions: Omit<StateTransitionRecord, 'id'>[]
  ): Promise<(StateTransitionRecord & { pages: string[] })[]> {
    if (stateTransitions.length === 0) {
      return []
    }

    const pageGroups = await this.pageRepository.getByStateTransitions(
      stateTransitions.map((x) => x.stateTransitionHash)
    )
    const stateTransitionsWithPages = pageGroups.map((pages, i) => {
      const stateTransition = stateTransitions[i]
      if (stateTransition === undefined) {
        throw new Error('Programmer error: state transition count mismatch')
      }
      return { ...stateTransition, pages }
    })
    if (pageGroups.length !== stateTransitions.length) {
      throw new Error('Missing pages for state transitions in database')
    }

    const { oldHash, id } = await this.readLastUpdate()
    await this.ensureRollupState(oldHash)

    return stateTransitionsWithPages.map((transition, i) => ({
      id: id + i + 1,
      ...transition,
    }))
  }

  async processOnChainStateTransition(
    stateTransitionRecord: StateTransitionRecord,
    onChainData: OnChainData
  ) {
    if (!this.rollupState) {
      throw new Error('Rollup state not initialized')
    }
    const { newPositions, fundingByTimestamp } =
      await this.rollupState.calculateUpdatedPositions(onChainData)
    return this.processStateTransition(
      stateTransitionRecord,
      onChainData,
      newPositions,
      fundingByTimestamp
    )
  }

  async processStateTransition(
    stateTransitionRecord: StateTransitionRecord,
    starkExProgramOutput: StarkExProgramOutput,
    newPositions: { index: bigint; value: Position }[],
    fundingByTimestamp?: FundingByTimestamp
  ) {
    if (!this.rollupState) {
      return
    }

    const { id, blockNumber, stateTransitionHash } = stateTransitionRecord
    const block = await this.ethereumClient.getBlock(blockNumber)
    const timestamp = Timestamp.fromSeconds(block.timestamp)

    const rollupState = await this.rollupState.update(
      newPositions,
      fundingByTimestamp
    )
    this.rollupState = rollupState

    const rootHash = await rollupState.positions.hash()
    if (rootHash !== starkExProgramOutput.newState.positionRoot) {
      throw new Error('State transition calculated incorrectly')
    }
    const transactionHashes = await this.extractTransactionHashes(
      starkExProgramOutput.forcedActions
    )
    await Promise.all([
      this.stateUpdateRepository.add({
        stateUpdate: {
          id,
          blockNumber,
          stateTransitionHash,
          rootHash,
          timestamp,
        },
        positions: newPositions.map(
          ({ value, index }): PositionRecord => ({
            positionId: index,
            starkKey: value.starkKey,
            balances: value.assets,
            collateralBalance: value.collateralBalance,
          })
        ),
        prices: starkExProgramOutput.newState.oraclePrices,
        transactionHashes,
      }),
    ])
    this.logger.info('State updated', { id, blockNumber })
  }

  async extractTransactionHashes(
    forcedActions: ForcedAction[]
  ): Promise<Hash256[]> {
    const hashes =
      await this.forcedTransactionsRepository.getTransactionHashesByData(
        forcedActions
      )
    const filteredHashes = hashes.filter(
      (h): h is Exclude<typeof h, undefined> => h !== undefined
    )

    if (filteredHashes.length !== forcedActions.length) {
      throw new Error(
        'Forced action included in state update does not have a matching mined transaction'
      )
    }

    return filteredHashes
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.stateUpdateRepository.deleteAfter(blockNumber)
  }

  async readLastUpdate() {
    const lastUpdate = await this.stateUpdateRepository.findLast()
    if (lastUpdate) {
      return { oldHash: lastUpdate.rootHash, id: lastUpdate.id }
    }
    return { oldHash: ROLLUP_STATE_EMPTY_HASH, id: 0 }
  }

  async ensureRollupState(oldHash: PedersenHash, height?: bigint) {
    if (!this.rollupState) {
      if (oldHash === ROLLUP_STATE_EMPTY_HASH) {
        this.rollupState = await RollupState.empty(
          this.rollupStateRepository,
          height
        )
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
