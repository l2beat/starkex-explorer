import { OnChainData } from '@explorer/encoding'
import { AssetId, PedersenHash, Timestamp } from '@explorer/types'
import { zip } from 'lodash'

import { NodeOrLeaf } from './MerkleNode'
import { MerkleTree } from './MerkleTree'
import { PositionLeaf } from './PositionLeaf'
import { VaultLeaf } from './VaultLeaf'

export interface IRollupStateStorage<T extends PositionLeaf | VaultLeaf> {
  recover(hash: PedersenHash): Promise<NodeOrLeaf<T>>
  persist(values: NodeOrLeaf<T>[]): Promise<void>
}

export type OnChainUpdate = Pick<
  OnChainData,
  'positions' | 'funding' | 'oldState'
>

export type FundingByTimestamp = Map<Timestamp, ReadonlyMap<AssetId, bigint>>

export class RollupState<T extends PositionLeaf | VaultLeaf> {
  constructor(
    private readonly storage: IRollupStateStorage<T>,
    public readonly stateTree: MerkleTree<T>
  ) {}

  static recover<T extends PositionLeaf | VaultLeaf>(
    storage: IRollupStateStorage<T>,
    rootHash: PedersenHash,
    height = 64n
  ) {
    return new RollupState(storage, new MerkleTree(storage, height, rootHash))
  }

  static async empty<T extends PositionLeaf | VaultLeaf>(
    storage: IRollupStateStorage<T>,
    height: bigint,
    emptyLeaf: T
  ) {
    return new RollupState(
      storage,
      await MerkleTree.create(storage, height, emptyLeaf)
    )
  }

  async update(newPositions: { index: bigint; value: T }[]) {
    const positions = await this.stateTree.update(newPositions)
    return new RollupState(this.storage, positions)
  }

  async calculateUpdatedPositions(
    onChainData: OnChainUpdate
  ): Promise<{ index: bigint; value: PositionLeaf }[]> {
    const fundingByTimestamp = this.getFundingByTimestamp(onChainData)
    const updatedPositionIds = onChainData.positions.map((x) => x.positionId)

    // TODO: fix
    const tree = this.stateTree as MerkleTree<PositionLeaf>
    // const oldPositions = await this.positionTree.getLeaves(updatedPositionIds)
    const oldPositions = await tree.getLeaves(updatedPositionIds)
    const newPositions = zip(oldPositions, onChainData.positions).map(
      ([oldPosition, update]) => {
        if (!oldPosition || !update) {
          throw new Error('Invalid update count')
        }
        // This is a special case for state update 11506, position 263516
        // This position had it's timestamp set to zero, which according to
        // our understading shouldn't be possible. We have determined
        // experimentally that using data from old funding results in a correct
        // position tree hash
        const timestamp =
          update.fundingTimestamp === Timestamp(0)
            ? onChainData.oldState.timestamp
            : update.fundingTimestamp

        const funding = fundingByTimestamp.get(timestamp)
        if (!funding) {
          throw new Error(
            `Missing funding for timestamp: ${timestamp.toString()}!`
          )
        }
        const updatedAssets = new Set(update.balances.map((x) => x.assetId))

        const assets = oldPosition.assets.filter(
          (x) => !updatedAssets.has(x.assetId)
        )

        for (const updated of update.balances) {
          if (updated.balance === 0n) {
            continue
          }
          assets.push({
            assetId: updated.assetId,
            balance: updated.balance,
            fundingIndex: 0n,
          })
        }

        const newPositionAssets = assets.map((x) => {
          const fundingIndex = funding.get(x.assetId)
          if (fundingIndex === undefined) {
            throw new Error(
              `Missing funding for asset: ${x.assetId.toString()}!`
            )
          }
          return { ...x, fundingIndex }
        })

        const newPositionLeaf = new PositionLeaf(
          update.starkKey,
          update.collateralBalance,
          newPositionAssets
        )
        return { index: update.positionId, value: newPositionLeaf }
      }
    )
    return newPositions
  }

  private getFundingByTimestamp(
    onChainData: OnChainUpdate
  ): FundingByTimestamp {
    const fundingByTimestamp = new Map<
      Timestamp,
      ReadonlyMap<AssetId, bigint>
    >()
    const oldState = onChainData.oldState
    fundingByTimestamp.set(
      oldState.timestamp,
      new Map(oldState.indices.map((i) => [i.assetId, i.value]))
    )
    for (const { timestamp, indices } of onChainData.funding) {
      const funding = new Map<AssetId, bigint>()
      for (const { assetId, value } of indices) {
        funding.set(assetId, value)
      }
      fundingByTimestamp.set(timestamp, funding)
    }
    return fundingByTimestamp
  }
}
