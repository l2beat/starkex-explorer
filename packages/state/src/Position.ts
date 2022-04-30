import { pedersen } from '@explorer/crypto'
import { encodeAssetId } from '@explorer/encoding'
import { AssetId, PedersenHash, StarkKey } from '@explorer/types'

import { MerkleValue } from './MerkleValue'

const MIN_INT_64 = -(2n ** 63n)

export interface PositionAsset {
  readonly assetId: AssetId
  readonly balance: bigint
  readonly fundingIndex: bigint
}

export class Position extends MerkleValue {
  static EMPTY = new Position(StarkKey.ZERO, 0n, [])

  constructor(
    public readonly publicKey: StarkKey,
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
      this.publicKey.substring(2),
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
      publicKey: this.publicKey,
      collateralBalance: this.collateralBalance,
      assets: this.assets,
    }
  }

  static fromJSON(
    data: ReturnType<typeof Position.prototype.toJSON>,
    knownHash?: PedersenHash
  ) {
    return new Position(
      data.publicKey,
      BigInt(data.collateralBalance),
      data.assets.map((x) => ({
        assetId: AssetId(x.assetId),
        balance: BigInt(x.balance),
        fundingIndex: BigInt(x.fundingIndex),
      })),
      knownHash
    )
  }

  toJSON() {
    return {
      publicKey: this.publicKey,
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

function packBytes(
  values: { bytes: number; value: string | bigint | number }[]
) {
  return values
    .map(({ bytes, value }) => {
      const string = typeof value === 'string' ? value : value.toString(16)
      return string.padStart(bytes * 2, '0')
    })
    .join('')
}
