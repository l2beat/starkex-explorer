import { OnChainData } from '@explorer/encoding'
import { PositionLeaf, RollupState } from '@explorer/state'
import { PedersenHash } from '@explorer/types'

import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { PageRepository } from '../peripherals/database/PageRepository'
import { RollupStateRepository } from '../peripherals/database/RollupStateRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { Logger } from '../tools/Logger'
import { StateUpdater } from './StateUpdater'

/**
 * @internal
 * Same as `await RollupState.empty().then(empty => empty.positions.hash())`
 */
export const ROLLUP_STATE_EMPTY_HASH = PedersenHash(
  '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
)

const positionTreeHeight = 64n

export class PerpetualRollupUpdater extends StateUpdater<PositionLeaf> {
  constructor(
    private readonly pageRepository: PageRepository,
    protected readonly stateUpdateRepository: StateUpdateRepository,
    protected readonly rollupStateRepository: RollupStateRepository<PositionLeaf>,
    protected readonly ethereumClient: EthereumClient,
    protected readonly forcedTransactionsRepository: ForcedTransactionsRepository,
    protected readonly logger: Logger,
    protected state?: RollupState<PositionLeaf>
  ) {
    super(
      stateUpdateRepository,
      rollupStateRepository,
      ethereumClient,
      forcedTransactionsRepository,
      logger,
      ROLLUP_STATE_EMPTY_HASH,
      PositionLeaf.EMPTY,
      state
    )
  }

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
    await this.ensureState(oldHash, positionTreeHeight)

    return stateTransitionsWithPages.map((transition, i) => ({
      id: id + i + 1,
      ...transition,
    }))
  }

  async processOnChainStateTransition(
    stateTransitionRecord: StateTransitionRecord,
    onChainData: OnChainData
  ) {
    if (!this.state) {
      throw new Error('Rollup state not initialized')
    }
    const newPositions = await this.state.calculateUpdatedPositions(onChainData)
    return this.processStateTransition(
      stateTransitionRecord,
      onChainData.newState.positionRoot,
      onChainData.forcedActions,
      onChainData.newState.oraclePrices,
      newPositions
    )
  }
}
