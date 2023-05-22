import { decodeAssetId } from '@explorer/encoding'
import { AssetId, PedersenHash, StarkKey } from '@explorer/types'

import { PerpetualBatchResponse } from './schema'

export interface PerpetualBatch {
  previousBatchId: number
  positionRoot: PedersenHash
  orderRoot: PedersenHash
  positions: PerpetualBatchPosition[]
  orders: PerpetualBatchOrder[]
}

interface PerpetualBatchPosition {
  positionId: bigint
  starkKey: StarkKey
  collateralBalance: bigint
  assets: PerpetualAsset[]
}

interface PerpetualAsset {
  assetId: AssetId
  balance: bigint
  fundingIndex: bigint
}

interface PerpetualBatchOrder {
  orderId: bigint
  amount: bigint
}

export function toPerpetualBatch(
  response: PerpetualBatchResponse
): PerpetualBatch | undefined {
  if (!response.update) {
    return
  }

  return {
    previousBatchId: Number(response.update.prev_batch_id),
    positionRoot: PedersenHash(response.update.position_root),
    orderRoot: PedersenHash(response.update.order_root),
    positions: Object.entries(response.update.positions).map(
      ([positionId, position]) => ({
        positionId: BigInt(positionId),
        collateralBalance: BigInt(position.collateral_balance),
        starkKey: StarkKey.from(BigInt(position.public_key)),
        assets: Object.entries(position.assets).map(([assetId, asset]) => ({
          assetId: decodeAssetId(assetId.slice(2)),
          balance: BigInt(asset.balance),
          fundingIndex: BigInt(asset.cached_funding_index),
        })),
      })
    ),
    orders: Object.entries(response.update.orders).map(([orderId, order]) => ({
      orderId: BigInt(orderId),
      amount: BigInt(order.fulfilled_amount),
    })),
  }
}
