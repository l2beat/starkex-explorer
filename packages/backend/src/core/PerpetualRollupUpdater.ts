import { OnChainData } from '@explorer/encoding'
import {
  calculateUpdatedPositions,
  IMerkleStorage,
  MerkleTree,
  PositionLeaf,
} from '@explorer/state'
import { Hash256, PedersenHash } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'

import { PageRepository } from '../peripherals/database/PageRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { StateUpdater } from './StateUpdater'

export const EMPTY_STATE_HASH = PedersenHash(
  '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
)

const positionTreeHeight = 64n

export interface PerpetualRollupStateTransition {
  blockNumber: number
  transactionHash: Hash256
  stateTransitionHash: Hash256
  sequenceNumber: number
  batchId: number
}

export class PerpetualRollupUpdater extends StateUpdater<PositionLeaf> {
  constructor(
    private readonly pageRepository: PageRepository,
    protected readonly stateUpdateRepository: StateUpdateRepository,
    protected readonly merkleStorage: IMerkleStorage<PositionLeaf>,
    protected readonly ethereumClient: EthereumClient,
    protected readonly userTransactionRepository: UserTransactionRepository,
    protected readonly logger: Logger,
    public stateTree?: MerkleTree<PositionLeaf>
  ) {
    super(
      stateUpdateRepository,
      merkleStorage,
      ethereumClient,
      userTransactionRepository,
      logger,
      EMPTY_STATE_HASH,
      PositionLeaf.EMPTY,
      stateTree
    )
  }

  async initTree() {
    const { oldHash } = await this.readLastUpdate()
    await this.ensureStateTree(oldHash, positionTreeHeight)
  }

  async loadRequiredPages(
    stateTransitions: PerpetualRollupStateTransition[]
  ): Promise<
    (PerpetualRollupStateTransition & { pages: string[]; id: number })[]
  > {
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
    await this.ensureStateTree(oldHash, positionTreeHeight)

    return stateTransitionsWithPages.map((transition, i) => ({
      id: id + i + 1,
      ...transition,
    }))
  }

  async processOnChainStateTransition(
    stateTransitionRecord: StateTransitionRecord,
    batchId: number,
    onChainData: OnChainData
  ) {
    if (!this.stateTree) {
      throw new Error('State tree not initialized')
    }
    const newPositions = await calculateUpdatedPositions(
      this.stateTree,
      onChainData
    )
    return this.processStateTransition(
      stateTransitionRecord,
      batchId,
      onChainData.newState.positionRoot,
      onChainData.forcedActions,
      onChainData.newState.oraclePrices,
      newPositions
    )
  }
}
