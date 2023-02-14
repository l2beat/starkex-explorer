import { AssetHash, PedersenHash, StarkKey } from '@explorer/types'

import { SpotBatchResponse } from './schema'

export interface SpotBatch {
  previousBatchId: number
  vaultRoot: PedersenHash
  orderRoot: PedersenHash
  vaults: SpotBatchVault[]
  orders: SpotBatchOrder[]
}

export interface SpotBatchVault {
  vaultId: bigint
  starkKey: StarkKey
  assetHash: AssetHash
  balance: bigint
}

export interface SpotBatchOrder {
  orderId: bigint
  amount: bigint
}

export function toSpotBatch(
  response: SpotBatchResponse
): SpotBatch | undefined {
  if (!response.update) {
    return
  }

  return {
    previousBatchId: Number(response.update.prev_batch_id),
    vaultRoot: PedersenHash(response.update.vault_root),
    orderRoot: PedersenHash(response.update.order_root),
    vaults: Object.entries(response.update.vaults).map(([vaultId, vault]) => ({
      vaultId: BigInt(vaultId),
      starkKey: StarkKey.from(BigInt(vault.stark_key)),
      assetHash: AssetHash(vault.token),
      balance: BigInt(vault.balance),
    })),
    orders: Object.entries(response.update.orders).map(([orderId, order]) => ({
      orderId: BigInt(orderId),
      amount: BigInt(order.fulfilled_amount),
    })),
  }
}
