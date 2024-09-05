import { ForcedAction, OraclePrice, State } from '@explorer/encoding'
import {
  IMerkleStorage,
  MerkleProof,
  MerkleTree,
  PositionLeaf,
  VaultLeaf,
} from '@explorer/state'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'

import { PositionRecord } from '../peripherals/database/PositionRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'

export class StateUpdater<
  T extends PositionLeaf | VaultLeaf = PositionLeaf | VaultLeaf
> {
  constructor(
    protected readonly stateUpdateRepository: StateUpdateRepository,
    protected readonly merkleStorage: IMerkleStorage<T>,
    protected readonly ethereumClient: EthereumClient,
    protected readonly userTransactionRepository: UserTransactionRepository,
    protected readonly logger: Logger,
    protected readonly emptyStateHash: PedersenHash,
    protected readonly emptyLeaf: T,
    public stateTree?: MerkleTree<T>
  ) {
    this.logger = logger.for(this)
  }

  async processStateTransition(
    stateTransitionRecord: StateTransitionRecord,
    batchId: number,
    expectedPositionRoot: PedersenHash,
    forcedActions: ForcedAction[],
    oraclePrices: OraclePrice[],
    newLeaves: { index: bigint; value: T }[],
    perpetualState?: State
  ) {
    if (!this.stateTree) {
      throw new Error('State tree not initialized')
    }

    this.stateTree = await this.stateTree.update(newLeaves)

    const rootHash = await this.stateTree.hash()
    if (rootHash !== expectedPositionRoot) {
      throw new Error('State transition calculated incorrectly')
    }
    const transactionHashes = await this.extractTransactionHashes(forcedActions)
    const { id, blockNumber, stateTransitionHash } = stateTransitionRecord
    const block = await this.ethereumClient.getBlock(blockNumber)
    const timestamp = Timestamp.fromSeconds(block.timestamp)
    const stateUpdate: StateUpdateRecord = {
      id,
      batchId,
      blockNumber,
      stateTransitionHash,
      rootHash,
      timestamp,
      perpetualState,
    }
    await Promise.all([
      this.stateUpdateRepository.add({
        stateUpdate,
        positions: this.getPositionUpdates(newLeaves),
        vaults: this.getVaultUpdates(newLeaves),
        prices: oraclePrices,
        transactionHashes,
      }),
      this.userTransactionRepository.addManyIncluded(
        transactionHashes.map((transactionHash) => ({
          transactionHash,
          blockNumber,
          timestamp,
          stateUpdateId: id,
        }))
      ),
    ])
    this.logger.info('State updated', { id, blockNumber })
    return stateUpdate
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
      assetHash: value.assetHash,
      balance: value.balance,
    }))
  }

  async extractTransactionHashes(
    forcedActions: ForcedAction[]
  ): Promise<Hash256[]> {
    const notIncluded = await this.userTransactionRepository.getNotIncluded([
      'ForcedTrade',
      'ForcedWithdrawal',
      'FullWithdrawal',
    ])

    const matchedHashes: Hash256[] = []

    forcedActions.forEach((action) => {
      let txIndex = -1
      if (action.type === 'trade') {
        txIndex = notIncluded.findIndex(
          (tx) =>
            tx.data.type === 'ForcedTrade' &&
            tx.data.starkKeyA === action.starkKeyA &&
            tx.data.starkKeyB === action.starkKeyB &&
            tx.data.positionIdA === action.positionIdA &&
            tx.data.positionIdB === action.positionIdB &&
            tx.data.collateralAmount === action.collateralAmount &&
            tx.data.syntheticAssetId === action.syntheticAssetId &&
            tx.data.syntheticAmount === action.syntheticAmount &&
            tx.data.nonce === action.nonce &&
            tx.data.isABuyingSynthetic === action.isABuyingSynthetic
        )
      } else if (action.type === 'withdrawal') {
        txIndex = notIncluded.findIndex(
          (tx) =>
            tx.data.type === 'ForcedWithdrawal' &&
            tx.data.positionId === action.positionId &&
            tx.data.starkKey === action.starkKey &&
            tx.data.quantizedAmount === action.amount
        )
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (action.type === 'fullWithdrawal') {
        txIndex = notIncluded.findIndex(
          (tx) =>
            tx.data.type === 'FullWithdrawal' &&
            tx.data.starkKey === action.starkKey &&
            tx.data.vaultId === action.vaultId
        )
      }

      if (txIndex === -1) {
        this.logger.error(
          'Forced action included in state update does not have a matching mined transaction'
        )
        console.log(action)
        // Due to many such errors on spot, we are ignoring them for now to continue syncing
        // throw new Error(
        //   'Forced action included in state update does not have a matching mined transaction'
        // )
        notIncluded.splice(txIndex, 1)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      matchedHashes.push(notIncluded[txIndex]!.transactionHash)

      // Remove the transaction from the list of not included transactions
      // so that it's not matched in the next iteration
      notIncluded.splice(txIndex, 1)
    })

    return matchedHashes
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

  async generateMerkleProof(
    positionOrVaultId: bigint
  ): Promise<MerkleProof<T>> {
    if (!this.stateTree) {
      throw new Error('State tree not initialized')
    }
    return await this.stateTree.getMerkleProofForLeaf(positionOrVaultId)
  }

  async ensureStateTree(hash: PedersenHash, height: bigint) {
    if (!this.stateTree) {
      if (hash === this.emptyStateHash) {
        this.stateTree = await MerkleTree.create(
          this.merkleStorage,
          height,
          this.emptyLeaf
        )
      } else {
        this.stateTree = new MerkleTree(this.merkleStorage, height, hash)
      }
    } else if ((await this.stateTree.hash()) !== hash) {
      this.stateTree = new MerkleTree(this.merkleStorage, height, hash)
    }
    return this.stateTree
  }
}
