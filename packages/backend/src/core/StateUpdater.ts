import { ForcedAction, OraclePrice } from '@explorer/encoding'
import {
  IRollupStateStorage,
  ISpotStateStorage,
  PositionLeaf,
  RollupState,
  SpotState,
  VaultLeaf,
} from '@explorer/state'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'

import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { PositionRecord } from '../peripherals/database/PositionRepository'
import { RollupStateRepository } from '../peripherals/database/RollupStateRepository'
import { SpotStateRepository } from '../peripherals/database/SpotStateRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'

/**
 * @internal
 * Same as `await RollupState.empty().then(empty => empty.positions.hash())`
 */

export class StateUpdater {
  constructor(
    protected readonly stateUpdateRepository: StateUpdateRepository,
    protected readonly rollupStateRepository:
      | RollupStateRepository
      | SpotStateRepository,
    protected readonly ethereumClient: EthereumClient,
    protected readonly forcedTransactionsRepository: ForcedTransactionsRepository,
    protected readonly logger: Logger,
    protected readonly emptyStateHash: PedersenHash,
    protected state?: RollupState | SpotState
  ) {}

  async processStateTransition(
    stateTransitionRecord: StateTransitionRecord,
    expectedPositionRoot: PedersenHash,
    forcedActions: ForcedAction[],
    oraclePrices: OraclePrice[],
    newPositionLeaves: { index: bigint; value: PositionLeaf }[],
    newVaultLeaves: { index: bigint; value: VaultLeaf }[]
  ) {
    if (!this.state) {
      return
    }

    if (this.state instanceof RollupState) {
      this.state = await this.state.update(newPositionLeaves)
    } else {
      this.state = await this.state.update(newVaultLeaves)
    }

    const rootHash = await this.state.positionTree.hash()
    if (rootHash !== expectedPositionRoot) {
      throw new Error('State transition calculated incorrectly')
    }
    const transactionHashes = await this.extractTransactionHashes(forcedActions)
    const { id, blockNumber, stateTransitionHash } = stateTransitionRecord
    const block = await this.ethereumClient.getBlock(blockNumber)
    const timestamp = Timestamp.fromSeconds(block.timestamp)

    await Promise.all([
      this.stateUpdateRepository.add({
        stateUpdate: {
          id,
          blockNumber,
          stateTransitionHash,
          rootHash,
          timestamp,
        },
        positions: newPositionLeaves.map(
          ({ value, index }): PositionRecord => ({
            positionId: index,
            starkKey: value.starkKey,
            balances: value.assets,
            collateralBalance: value.collateralBalance,
          })
        ),
        vaults: newVaultLeaves.map(({ value, index }) => ({
          vaultId: index,
          starkKey: value.starkKey,
          token: value.token,
          balance: value.balance,
        })),
        prices: oraclePrices,
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
    return { oldHash: this.emptyStateHash, id: 0 }
  }

  // TODO: there should be one method for both spot and rollup states
  async ensureSpotState(oldHash: PedersenHash, height: bigint) {
    if (!this.state) {
      if (oldHash === this.emptyStateHash) {
        this.state = await SpotState.empty(
          this.rollupStateRepository as ISpotStateStorage,
          height
        )
      } else {
        this.state = SpotState.recover(
          this.rollupStateRepository as ISpotStateStorage,
          oldHash,
          height
        )
      }
    } else if ((await this.state.positionTree.hash()) !== oldHash) {
      this.state = SpotState.recover(
        this.rollupStateRepository as ISpotStateStorage,
        oldHash,
        height
      )
    }
    return this.state
  }

  async ensureRollupState(oldHash: PedersenHash, height?: bigint) {
    if (!this.state) {
      if (oldHash === this.emptyStateHash) {
        this.state = await RollupState.empty(
          this.rollupStateRepository as IRollupStateStorage,
          height
        )
      } else {
        this.state = RollupState.recover(
          this.rollupStateRepository as IRollupStateStorage,
          oldHash,
          height
        )
      }
    } else if ((await this.state.positionTree.hash()) !== oldHash) {
      this.state = RollupState.recover(
        this.rollupStateRepository as IRollupStateStorage,
        oldHash,
        height
      )
    }
    return this.state
  }
}
