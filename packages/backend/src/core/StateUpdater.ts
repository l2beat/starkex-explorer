import { ForcedAction, OraclePrice } from '@explorer/encoding'
import {
  IMerkleStorage,
  MerkleProof,
  MerkleTree,
  PositionLeaf,
  VaultLeaf,
} from '@explorer/state'
import { Hash256, PedersenHash, Timestamp } from '@explorer/types'

import { PositionRecord } from '../peripherals/database/PositionRepository'
import { StateTransitionRecord } from '../peripherals/database/StateTransitionRepository'
import {
  StateUpdateRecord,
  StateUpdateRepository,
} from '../peripherals/database/StateUpdateRepository'
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
  ) {
    this.logger = logger.for(this)
  }

  async processStateTransition(
    stateTransitionRecord: StateTransitionRecord,
    batchId: number,
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
    const stateUpdate: StateUpdateRecord = {
      id,
      batchId,
      blockNumber,
      stateTransitionHash,
      rootHash,
      timestamp,
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

  async formatMerkleProofForEscape(positionOrVaultId: bigint, proof: MerkleProof<T>): Promise<bigint[]> {
    // See the format of the proof here: 
    // https://vscode.dev/github/starkware-libs/starkex-contracts/blob/master/scalable-dex/contracts/src/components/PedersenMerkleVerifier.sol#L25
    // Important: for perpetuals, there are values additionally appended to the proof, see:
    // https://vscode.dev/github/starkware-libs/starkex-contracts/blob/master/scalable-dex/contracts/src/perpetual/components/PerpetualEscapeVerifier.sol#L137
    const result: bigint[] = []

    for (const step of proof.path) {
      // +-------------------------------+---------------------------+-----------+
      // | left_node_n (252)             | right_node_n (252)        | zeros (8) |
      // +-------------------------------+-----------+---------------+-----------+
      const leftBigInt = BigInt('0x' + step.left.toString())
      const rightBigInt = BigInt('0x' + step.right.toString())
      const leftTrimmed = leftBigInt & ((1n << 252n) - 1n)
      const rightTrimmed = rightBigInt & ((1n << 252n) - 1n)
      const entry = ((leftTrimmed << 252n) | rightTrimmed) << 8n
      // Split into 2 256-bit chunks and add to result
      result.push(entry >> 256n)
      result.push(entry & ((1n << 256n) - 1n))
    }

    // Add root and leaf index
    // +-------------------------------+-----------+---------------+-----------+
    // | root (252)                    | zeros (4) | nodeIdx (248) | zeros (8) |
    // +-------------------------------+-----------+---------------+-----------+
    const rootBigInt = BigInt('0x' + proof.root.toString())
    const rootTrimmed = rootBigInt & ((1n << 252n) - 1n)
    // index needs to be adjusted due to increased tree height
    // stemming from including the leaf values in the proof
    const adjustedIndex = positionOrVaultId << BigInt(proof.leafPrefixLength)
    const indexTrimmed = adjustedIndex & ((1n << 248n) - 1n)
    const entry = (((rootTrimmed << 4n) << 248n) | indexTrimmed) << 8n
    // Split into 2 256-bit chunks and add to result
    result.push(entry >> 256n)
    result.push(entry & ((1n << 256n) - 1n))

    console.log('Merkle proof for escape:')
    console.log(result.map(x => bigIntToHex64(x)).join('\n'))

    return result
  }

  async generateMerkleProof(positionOrVaultId: bigint) {
    if (!this.stateTree) {
      throw new Error('State tree not initialized')
    }
    const proof = await this.stateTree.getMerkleProofForLeaf(positionOrVaultId)
    await this.formatMerkleProofForEscape(positionOrVaultId, proof)
    return proof
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

function bigIntToHex64(bigInt: BigInt): string {
  let hexString = bigInt.toString(16);

  while (hexString.length < 64) {
    hexString = '0' + hexString;
  }

  return '"0x'+hexString+'"';
}