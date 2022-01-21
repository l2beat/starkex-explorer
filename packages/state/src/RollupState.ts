import { PedersenHash } from '@explorer/crypto'
import { OnChainData } from '@explorer/encoding'

import { NodeOrLeaf } from './MerkleNode'
import { MerkleTree } from './MerkleTree'
import { Position } from './Position'

interface RollupParameters {
  readonly timestamp: bigint
  readonly funding: ReadonlyMap<string, bigint>
}

export interface IRollupStateStorage {
  getParameters(rootHash: PedersenHash): Promise<RollupParameters>
  setParameters(
    rootHash: PedersenHash,
    values: RollupParameters
  ): Promise<RollupParameters>

  recover(hash: PedersenHash): Promise<NodeOrLeaf<Position>>
  persist(values: NodeOrLeaf<Position>[]): Promise<void>
}

export class RollupState {
  private positions: MerkleTree<Position>
  private timestamp?: bigint
  private funding?: ReadonlyMap<string, bigint>

  constructor(
    private readonly storage: IRollupStateStorage,
    rootHash: PedersenHash
  ) {
    this.positions = new MerkleTree(storage, 64n, rootHash)
  }

  async update(onChainData: OnChainData) {
    const fundingByTimestamp = await this.getFundingByTimestamp(onChainData)
    const updatedPositionIds = onChainData.positions.map((x) => x.positionId)
    const oldPositions = await this.positions.getLeaves(updatedPositionIds)
    const newPositions = oldPositions.map((oldPosition, i) => {
      const update = onChainData.positions[i]
      const funding =
        update.fundingTimestamp !== 0n
          ? fundingByTimestamp.get(update.fundingTimestamp)
          : new Map<string, bigint>()
      if (!funding) {
        throw new Error('Missing funding!')
      }
      const updatedAssets = new Set(update.balances.map((x) => x.assetId))
      const assets = oldPosition.assets.filter(
        (x) => !updatedAssets.has(x.assetId)
      )
      for (const updated of update.balances) {
        if (updated.balance === 0n) {
          continue
        }
        const fundingIndex = funding.get(updated.assetId)
        if (fundingIndex === undefined) {
          throw new Error('Missing funding!')
        }
        assets.push({
          assetId: updated.assetId,
          balance: updated.balance,
          fundingIndex: fundingIndex,
        })
      }
      const newPosition = new Position(
        update.publicKey,
        update.fundingTimestamp,
        assets
      )
      return { index: update.positionId, value: newPosition }
    })
    await this.positions.update(newPositions)
    console.log(fundingByTimestamp)
  }

  private async getFundingByTimestamp(onChainData: OnChainData) {
    const { timestamp, funding } = await this.getParameters()
    const fundingByTimestamp = new Map<bigint, ReadonlyMap<string, bigint>>()
    fundingByTimestamp.set(timestamp, funding)
    for (const { timestamp, indices } of onChainData.funding) {
      const funding = new Map<string, bigint>()
      for (const { assetId, value } of indices) {
        funding.set(assetId, value)
      }
      fundingByTimestamp.set(timestamp, funding)
    }
    return fundingByTimestamp
  }

  private async getParameters(): Promise<RollupParameters> {
    if (this.timestamp === undefined || this.funding === undefined) {
      const { timestamp, funding } = await this.storage.getParameters(
        await this.positions.hash()
      )
      this.timestamp = timestamp
      this.funding = funding
    }
    return {
      timestamp: this.timestamp,
      funding: this.funding,
    }
  }
}
