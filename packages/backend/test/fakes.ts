import { ForcedTrade,ForcedWithdrawal } from '@explorer/encoding'
import { AssetId, StarkKey, Timestamp } from '@explorer/types'

import {
  Updates,
} from '../src/peripherals/database/ForcedTransactionsRepository'

const MAX_SAFE_POSTGRES_INT = 2 ** 31 - 1
export function fakeInt(max = MAX_SAFE_POSTGRES_INT): number {
  return Math.floor(Math.random() * max)
}

export function fakeBigInt(max = Number.MAX_SAFE_INTEGER): bigint {
  return BigInt(fakeInt(max))
}

export function fakeBoolean(): boolean {
  return Math.random() > 0.5
}

export function fakeTimestamp(max?: number): Timestamp {
  return Timestamp(fakeInt(max))
}

export function fakeWithdrawal(
  withdrawal?: Partial<Omit<ForcedWithdrawal, 'type'>>
): ForcedWithdrawal {
  return {
    type: 'withdrawal',
    publicKey: StarkKey.fake(),
    positionId: fakeBigInt(),
    amount: fakeBigInt(),
    ...withdrawal,
  }
}

export function fakeTrade(
  trade?: Partial<Omit<ForcedTrade, 'type'>>
): ForcedTrade {
  return {
    type: 'trade',
    collateralAmount: fakeBigInt(),
    isABuyingSynthetic: fakeBoolean(),
    nonce: fakeBigInt(),
    positionIdA: fakeBigInt(),
    positionIdB: fakeBigInt(),
    publicKeyA: StarkKey.fake(),
    publicKeyB: StarkKey.fake(),
    syntheticAmount: fakeBigInt(),
    syntheticAssetId: AssetId.USDC,
    ...trade,
  }
}

export function fakeForcedUpdates(updates?: Partial<Updates>): Updates {
  return {
    forgottenAt: null,
    minedAt: null,
    revertedAt: null,
    sentAt: null,
    verified: undefined,
    ...updates,
  }
}
