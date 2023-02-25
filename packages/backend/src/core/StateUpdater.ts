import { ForcedAction, OraclePrice } from '@explorer/encoding'
import {
  IMerkleStorage,
  MerkleTree,
  PositionLeaf,
  VaultLeaf,
} from '@explorer/state'
import {
  AssetHash,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'

import { PositionRecord } from '../peripherals/database/PositionRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import { StateUpdateRepository } from '../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../peripherals/database/transactions/UserTransactionRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'

export class StateUpdater<T extends PositionLeaf | VaultLeaf> {
  constructor(
    protected readonly stateUpdateRepository: StateUpdateRepository,
    protected readonly merkleStorage: IMerkleStorage<T>,
    protected readonly ethereumClient: EthereumClient,
    protected readonly userTransactionRepository: UserTransactionRepository,
    protected readonly logger: Logger,
    protected readonly emptyStateHash: PedersenHash,
    protected readonly emptyLeaf: T,
    public stateTree?: MerkleTree<T>
  ) {}

  async processStateTransition(
    stateTransitionRecord: StateTransitionRecord,
    expectedPositionRoot: PedersenHash,
    forcedActions: ForcedAction[],
    oraclePrices: OraclePrice[],
    newLeaves: { index: bigint; value: T }[]
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

      // TODO: why is this forced action in state update with no match in transactions?!
      if (
        action.type === 'fullWithdrawal' &&
        action.starkKey ===
          StarkKey(
            '0x05802e0e4637d450d85127e108d8b831773babb92ddb9302ea26c13eed4519c6'
          ) &&
        action.assetHash ===
          AssetHash(
            '0x0000000000000000000000000000000000000000000000000000000000000000'
          ) &&
        action.vaultId === 116933n &&
        action.balanceDifference === 0n
      ) {
        this.logger.error(
          'Ignoring specific forced action with no matching transaction'
        )
        notIncluded.splice(txIndex, 1)
        return
      }

      if (txIndex === -1) {
        throw new Error(
          'Forced action included in state update does not have a matching mined transaction'
        )
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
