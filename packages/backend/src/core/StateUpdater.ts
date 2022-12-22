import { ForcedAction, OraclePrice } from '@explorer/encoding'
import { PositionLeaf, RollupState, VaultLeaf } from '@explorer/state'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'

import { ForcedTransactionsRepository } from '../peripherals/database/ForcedTransactionsRepository'
import { PositionRecord } from '../peripherals/database/PositionRepository'
import { RollupStateRepository } from '../peripherals/database/RollupStateRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'

export class StateUpdater<T extends PositionLeaf | VaultLeaf> {
  constructor(
    protected readonly stateUpdateRepository: StateUpdateRepository,
    protected readonly rollupStateRepository: RollupStateRepository<T>,
    protected readonly ethereumClient: EthereumClient,
    protected readonly forcedTransactionsRepository: ForcedTransactionsRepository,
    protected readonly logger: Logger,
    protected readonly emptyStateHash: PedersenHash,
    protected readonly emptyLeaf: T,
    protected state?: RollupState<T>
  ) {}

  async processStateTransition(
    stateTransitionRecord: StateTransitionRecord,
    expectedPositionRoot: PedersenHash,
    forcedActions: ForcedAction[],
    oraclePrices: OraclePrice[],
    newLeaves: { index: bigint; value: T }[]
  ) {
    if (!this.state) {
      return
    }

    this.state = await this.state.update(newLeaves)

    const rootHash = await this.state.stateTree.hash()
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
        positions: this.getPositionUpdates(newLeaves),
        vaults: this.getVaultUpdates(newLeaves),
        prices: oraclePrices,
        transactionHashes,
      }),
    ])
    this.logger.info('State updated', { id, blockNumber })
  }

  getPositionUpdates(newLeaves: { index: bigint; value: T }[]) {
    if (!(this.emptyLeaf instanceof PositionLeaf)) {
      return []
    }
    const newPositionLeaves = newLeaves as {
      index: bigint
      value: PositionLeaf
    }[]
    return newPositionLeaves.map(
      ({ value, index }): PositionRecord => ({
        positionId: index,
        starkKey: value.starkKey,
        balances: value.assets,
        collateralBalance: value.collateralBalance,
      })
    )
  }

  getVaultUpdates(newLeaves: { index: bigint; value: T }[]) {
    if (!(this.emptyLeaf instanceof VaultLeaf)) {
      return []
    }
    const newVaultLeaves = newLeaves as { index: bigint; value: VaultLeaf }[]
    return newVaultLeaves.map(({ value, index }) => ({
      vaultId: index,
      starkKey: value.starkKey,
      token: value.token,
      balance: value.balance,
    }))
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

  async ensureState(oldHash: PedersenHash, height: bigint) {
    if (!this.state) {
      if (oldHash === this.emptyStateHash) {
        this.state = await RollupState.empty(
          this.rollupStateRepository,
          height,
          this.emptyLeaf
        )
      } else {
        this.state = RollupState.recover(
          this.rollupStateRepository,
          oldHash,
          height
        )
      }
    } else if ((await this.state.stateTree.hash()) !== oldHash) {
      this.state = RollupState.recover(
        this.rollupStateRepository,
        oldHash,
        height
      )
    }
    return this.state
  }
}
