import { pedersen } from '@explorer/crypto'
import { encodeAssetId, OnChainData } from '@explorer/encoding'
import {
  AssetId,
  json,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'

import { MerkleValue } from './MerkleValue'
import { packBytes } from './packBytes'

const MIN_INT_64 = -(2n ** 63n)

export interface PositionAsset {
  readonly assetId: AssetId
  readonly balance: bigint
  readonly fundingIndex: bigint
}

export type OnChainUpdate = Pick<
  OnChainData,
  'positions' | 'funding' | 'oldState'
>

export type FundingByTimestamp = Map<Timestamp, ReadonlyMap<AssetId, bigint>>

export class PositionLeaf extends MerkleValue {
  static EMPTY = new PositionLeaf(StarkKey.ZERO, 0n, [])

  constructor(
    public readonly starkKey: StarkKey,
    public readonly collateralBalance: bigint,
    public readonly assets: readonly PositionAsset[],
    protected knownHash?: PedersenHash
  ) {
    super()
  }

  async calculateHash() {
    const packedPosition = packBytes([
      { bytes: 8, value: this.collateralBalance - MIN_INT_64 },
      { bytes: 2, value: this.assets.length },
    ])
    const items = [
      ...this.assets.map(packAsset).sort(),
      this.starkKey.substring(2),
      packedPosition,
    ]
    let hash = PedersenHash.ZERO
    for (const item of items) {
      hash = await pedersen(hash, PedersenHash(item))
    }
    return hash
  }

  getData() {
    return {
      starkKey: this.starkKey,
      collateralBalance: this.collateralBalance,
      assets: this.assets,
    }
  }

  static fromJSON(data: json, knownHash?: PedersenHash) {
    const cast = data as unknown as ReturnType<
      typeof PositionLeaf.prototype.toJSON
    >
    return new PositionLeaf(
      StarkKey(cast.starkKey),
      BigInt(cast.collateralBalance),
      cast.assets.map((x) => ({
        assetId: AssetId(x.assetId),
        balance: BigInt(x.balance),
        fundingIndex: BigInt(x.fundingIndex),
      })),
      knownHash
    )
  }

  toJSON() {
    return {
      starkKey: this.starkKey.toString(),
      collateralBalance: this.collateralBalance.toString(),
      assets: this.assets.map((x) => ({
        assetId: x.assetId.toString(),
        balance: x.balance.toString(),
        fundingIndex: x.fundingIndex.toString(),
      })),
    }
  }
}

function packAsset(asset: PositionAsset) {
  return packBytes([
    { bytes: 16, value: encodeAssetId(asset.assetId) },
    { bytes: 8, value: asset.fundingIndex - MIN_INT_64 },
    { bytes: 8, value: asset.balance - MIN_INT_64 },
  ])
}

export function getFundingByTimestamp(
  onChainData: OnChainUpdate
): FundingByTimestamp {
  const fundingByTimestamp = new Map<Timestamp, ReadonlyMap<AssetId, bigint>>()
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
