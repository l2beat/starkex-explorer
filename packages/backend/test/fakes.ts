import {
  encodeAssetId,
  ForcedTrade,
  ForcedWithdrawal,
} from '@explorer/encoding'
import {
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { fakeHexString } from '@explorer/types/src/fake'
import { BigNumber, providers } from 'ethers'

import {
  LogWithdrawalPerformed,
  PERPETUAL_ABI,
} from '../src/core/FinalizeExitEventsCollector'
import {
  Accepted,
  ForcedTradeOfferRecord,
} from '../src/peripherals/database/ForcedTradeOfferRepository'
import {
  FinalizeExitAction,
  FinalizeUpdates,
  ForcedTransactionRecord,
  Updates,
} from '../src/peripherals/database/ForcedTransactionsRepository'
import { StateUpdateRecord } from '../src/peripherals/database/StateUpdateRepository'
import { Record as TransactionStatusRecord } from '../src/peripherals/database/TransactionStatusRepository'

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
    starkKey: StarkKey.fake(),
    positionId: fakeBigInt(),
    amount: fakeBigInt(),
    ...withdrawal,
  }
}

export function fakeFinalize(
  finalize?: Partial<FinalizeExitAction>
): FinalizeExitAction {
  const amount = fakeBigInt()
  return {
    starkKey: StarkKey.fake(),
    assetType: AssetId.USDC,
    quantizedAmount: amount,
    nonQuantizedAmount: amount,
    recipient: EthereumAddress.fake(),
    ...finalize,
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
    starkKeyA: StarkKey.fake(),
    starkKeyB: StarkKey.fake(),
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
    finalized: undefined,
    ...updates,
  }
}

export function fakeForcedUpdatesVerified(
  finalized?: Partial<FinalizeUpdates>
): Updates {
  const verifiedAt = fakeTimestamp()
  const minedAt = fakeTimestamp(Number(verifiedAt))
  const sentAt = fakeTimestamp(Number(minedAt))
  return {
    forgottenAt: null,
    revertedAt: null,
    sentAt,
    minedAt,
    verified: {
      at: verifiedAt,
      stateUpdateId: fakeInt(),
    },
    finalized: {
      hash: Hash256.fake(),
      forgottenAt: null,
      minedAt: null,
      revertedAt: null,
      sentAt: null,
      ...finalized,
    },
  }
}

export function fakeSentTransaction(
  record?: Partial<TransactionStatusRecord>
): TransactionStatusRecord & { sentAt: Timestamp } {
  return {
    hash: Hash256.fake(),
    forgottenAt: null,
    revertedAt: null,
    notFoundRetries: fakeInt(),
    ...record,
    sentAt: fakeTimestamp(),
    mined: undefined,
  }
}

export function fakeAccepted(accepted?: Partial<Accepted>): Accepted {
  return {
    at: fakeTimestamp(),
    nonce: fakeBigInt(),
    positionIdB: fakeBigInt(),
    premiumCost: fakeBoolean(),
    signature: fakeHexString(32),
    starkKeyB: StarkKey.fake(),
    submissionExpirationTime: fakeBigInt(),
    transactionHash: undefined,
    ...accepted,
  }
}

export function fakeOffer(
  offer?: Partial<ForcedTradeOfferRecord>
): ForcedTradeOfferRecord {
  return {
    id: fakeInt(),
    createdAt: fakeTimestamp(),
    starkKeyA: StarkKey.fake(),
    positionIdA: fakeBigInt(),
    syntheticAssetId: AssetId('ETH-9'),
    collateralAmount: fakeBigInt(),
    syntheticAmount: fakeBigInt(),
    isABuyingSynthetic: true,
    accepted: fakeAccepted(offer?.accepted),
    ...offer,
  }
}

export function fakeInitialOffer(
  offer?: Partial<Omit<ForcedTradeOfferRecord, 'accepted'>>
) {
  return fakeOffer({ ...offer, accepted: undefined, cancelledAt: undefined })
}

export function fakeExit(
  exit?: Partial<ForcedTransactionRecord>
): ForcedTransactionRecord {
  return {
    hash: Hash256.fake(),
    data: fakeWithdrawal(),
    updates: fakeForcedUpdates(),
    lastUpdateAt: fakeTimestamp(),
    ...exit,
  }
}

export function fakeBlock(block?: Partial<providers.Block>): providers.Block {
  return {
    hash: Hash256.fake().toString(),
    parentHash: Hash256.fake().toString(),
    transactions: [Hash256.fake().toString()],
    number: fakeInt(),
    timestamp: Number(fakeTimestamp()),
    nonce: fakeInt().toString(),
    difficulty: fakeInt(),
    _difficulty: BigNumber.from(fakeBigInt()),
    gasLimit: BigNumber.from(fakeBigInt()),
    gasUsed: BigNumber.from(fakeBigInt()),
    miner: EthereumAddress.fake().toString(),
    extraData: '',
    ...block,
  }
}

export function fakeFinalizeLog(log?: Partial<providers.Log>): providers.Log {
  const amount = fakeBigInt()
  return {
    blockNumber: fakeInt(),
    blockHash: Hash256.fake().toString(),
    transactionHash: Hash256.fake().toString(),
    transactionIndex: fakeInt(200),
    logIndex: fakeInt(10),
    address: EthereumAddress.fake().toString(),
    removed: false,
    ...PERPETUAL_ABI.encodeEventLog(
      PERPETUAL_ABI.getEvent(LogWithdrawalPerformed),
      [
        StarkKey.fake().toString(),
        '0x' + encodeAssetId(AssetId.USDC),
        amount,
        amount,
        EthereumAddress.fake().toString(),
      ]
    ),
    ...log,
  }
}

export function fakeStateUpdate(
  stateUpdate?: Partial<StateUpdateRecord>
): StateUpdateRecord {
  return {
    id: fakeInt(),
    blockNumber: fakeInt(),
    factHash: Hash256.fake(),
    rootHash: PedersenHash.fake(),
    timestamp: fakeTimestamp(),
    ...stateUpdate,
  }
}
