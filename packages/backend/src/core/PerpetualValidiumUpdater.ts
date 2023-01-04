import { StarkExProgramOutput } from '@explorer/encoding'
import { IMerkleStorage, MerkleTree, PositionLeaf } from '@explorer/state'
import { Hash256, PedersenHash } from '@explorer/types'

import { ForcedTransactionRepository } from '../peripherals/database/ForcedTransactionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { PerpetualBatch } from '../peripherals/starkware/toPerpetualBatch'
import { Logger } from '../tools/Logger'
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
    protected readonly forcedTransactionRepository: ForcedTransactionRepository,
    protected readonly logger: Logger,
    public stateTree?: MerkleTree<PositionLeaf>
  ) {
    super(
      stateUpdateRepository,
      merkleStorage,
      ethereumClient,
      forcedTransactionRepository,
      logger,
      EMPTY_STATE_HASH,
      PositionLeaf.EMPTY,
      stateTree
    )
  }

  async processValidiumStateTransition(
    transition: ValidiumStateTransition,
    programOutput: StarkExProgramOutput,
    batch: PerpetualBatch
  ) {
    const { oldHash, id } = await this.readLastUpdate()
    await this.ensureStateTree(oldHash, positionTreeHeight)

    const newPositions = buildNewPositionLeaves(batch)

    await this.processStateTransition(
      {
        id: id + 1,
        blockNumber: transition.blockNumber,
        stateTransitionHash: transition.stateTransitionHash,
      },
      programOutput.newState.positionRoot,
      programOutput.forcedActions,
      programOutput.newState.oraclePrices,
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
