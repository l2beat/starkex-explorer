import { StarkExProgramOutput } from '@explorer/encoding'
import { PositionLeaf, RollupState } from '@explorer/state'
import { Hash256, PedersenHash } from '@explorer/types'

import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { RollupStateRepository } from '../peripherals/database/RollupStateRepository'
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

/**
 * @internal
 * Same as `await RollupState.empty().then(empty => empty.positions.hash())`
 */
export const ROLLUP_STATE_EMPTY_HASH = PedersenHash(
  '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
)

const positionTreeHeight = 64n

export class PerpetualValidiumUpdater extends StateUpdater<PositionLeaf> {
  constructor(
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

  async processValidiumStateTransition(
    transition: ValidiumStateTransition,
    programOutput: StarkExProgramOutput,
    batch: PerpetualBatch
  ) {
    const { oldHash, id } = await this.readLastUpdate()
    await this.ensureState(oldHash, positionTreeHeight)

    const newPositions = this.buildNewPositionLeaves(batch)

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

  buildNewPositionLeaves(
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
}
