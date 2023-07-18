import { PerpetualCairoOutput } from '@explorer/encoding'
import { IMerkleStorage, MerkleTree, PositionLeaf } from '@explorer/state'
import { Hash256, PedersenHash } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'

import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { PerpetualBatch } from '../peripherals/starkware/toPerpetualBatchData'
import { StateUpdater } from './StateUpdater'

export interface ValidiumStateTransition {
  blockNumber: number
  transactionHash: Hash256
  stateTransitionHash: Hash256
  sequenceNumber: number
  batchId: number
}

export const EMPTY_STATE_HASH = PedersenHash(
  '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
)

const positionTreeHeight = 64n

export class PerpetualValidiumUpdater extends StateUpdater<PositionLeaf> {
  constructor(
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

  async processValidiumStateTransition(
    transition: ValidiumStateTransition,
    perpetualCairoOutput: PerpetualCairoOutput,
    batch: PerpetualBatch
  ) {
    const { oldHash, id } = await this.readLastUpdate()
    await this.ensureStateTree(oldHash, positionTreeHeight)

    const newPositions = buildNewPositionLeaves(batch)
    return await this.processStateTransition(
      {
        id: id + 1,
        blockNumber: transition.blockNumber,
        stateTransitionHash: transition.stateTransitionHash,
      },
      transition.batchId,
      perpetualCairoOutput.newState.positionRoot,
      perpetualCairoOutput.forcedActions,
      perpetualCairoOutput.newState.oraclePrices,
      newPositions
    )
  }
}

function buildNewPositionLeaves(
  batch: PerpetualBatch
): { index: bigint; value: PositionLeaf }[] {
  return batch.positions.map((position) => ({
    index: position.positionId,
    value: new PositionLeaf(
      position.starkKey,
      position.collateralBalance,
      position.assets
    ),
  }))
}
