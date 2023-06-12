import {
  ConditionalTransferL2TransactionData,
  DeleverageL2TransactionData,
  DepositL2TransactionData,
  ForcedTradeL2TransactionData,
  ForcedWithdrawalL2TransactionData,
  FundingTickL2TransactionData,
  L2TransactionData,
  LiquidateL2TransactionData,
  OraclePricesTickL2TransactionData,
  TradeL2TransactionData,
  TransferL2TransactionData,
  WithdrawToAddressL2TransactionData,
} from '@explorer/shared'
import { AssetHash, EthereumAddress, Hash256, StarkKey } from '@explorer/types'

import { L2TransactionEntry } from '../../view/components/tables/L2TransactionsTable'
import { Bucket } from './Bucket'
import { amountBucket, assetIdBucket } from './buckets'
import {
  randomBigInt,
  randomFutureTimestamp,
  randomInt,
  randomTimestamp,
  repeat,
} from './utils'

const randomAssetOraclePrice = () => ({
  syntheticAssetId: assetIdBucket.pick(),
  signedPrices: repeat(randomInt(1, 10), () => ({
    signerPublicKey: Hash256.fake(),
    externalAssetId: AssetHash.fake(),
    timestampedSignature: {
      signature: {
        r: Hash256.fake(),
        s: Hash256.fake(),
      },
      timestamp: randomTimestamp(),
    },
    price: randomBigInt(0, 1000000),
  })),
  price: randomBigInt(0, 1000000),
})

const randomFundingIndex = () => ({
  syntheticAssetId: assetIdBucket.pick(),
  quantizedFundingIndex: randomInt(0, 1000000),
})

export const l2TransactionsBucket = new Bucket<L2TransactionData>()
l2TransactionsBucket.addMany(repeat(5, randomL2DepositTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2WithdrawToAddressTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2ForcedWithdrawalTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2TradeTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2ForcedTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2TransferTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2ConditionalTransferTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2LiquidateTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2DeleverageTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2FundingTickTransaction))
l2TransactionsBucket.addMany(repeat(5, randomL2OraclePricesTickTransaction))

export function randomHomeL2TransactionEntry(): L2TransactionEntry {
  return {
    transactionId: randomInt(0, 10000),
    data: l2TransactionsBucket.pick(),
    stateUpdateId: randomInt(0, 100) > 20 ? undefined : randomInt(0, 10000),
  }
}

export function randomUserL2TransactionEntry(): L2TransactionEntry {
  return {
    transactionId: randomInt(0, 10000),
    data: l2TransactionsBucket.pick(),
    stateUpdateId: randomInt(0, 100) > 20 ? undefined : randomInt(0, 10000),
  }
}

export function randomL2TransactionEntry(
  data: L2TransactionEntry['data']
): L2TransactionEntry {
  return {
    transactionId: randomInt(0, 100000),
    stateUpdateId: randomInt(0, 10) > 7 ? undefined : randomInt(0, 100000),
    data,
  }
}

export function randomL2DepositTransaction(): DepositL2TransactionData {
  return {
    type: 'Deposit',
    positionId: randomBigInt(0, 100000),
    amount: amountBucket.pick(),
    starkKey: StarkKey.fake(),
  }
}

export function randomL2WithdrawToAddressTransaction(): WithdrawToAddressL2TransactionData {
  return {
    type: 'WithdrawToAddress',
    positionId: randomBigInt(0, 100000),
    amount: amountBucket.pick(),
    starkKey: StarkKey.fake(),
    ethereumAddress: EthereumAddress.fake(),
    nonce: randomBigInt(0, 100000),
    expirationTimestamp: randomFutureTimestamp(),
    signature: {
      r: Hash256.fake(),
      s: Hash256.fake(),
    },
  }
}

export function randomL2ForcedWithdrawalTransaction(): ForcedWithdrawalL2TransactionData {
  return {
    type: 'ForcedWithdrawal',
    positionId: randomBigInt(0, 100000),
    amount: amountBucket.pick(),
    starkKey: StarkKey.fake(),
    isValid: true,
  }
}
export function randomL2TradeTransaction(): TradeL2TransactionData {
  return {
    type: 'Trade',
    actualAFee: amountBucket.pick(),
    actualBFee: amountBucket.pick(),
    actualCollateral: amountBucket.pick(),
    actualSynthetic: amountBucket.pick(),
    partyAOrder: {
      nonce: randomBigInt(0, 100000),
      isBuyingSynthetic: true,
      expirationTimestamp: randomFutureTimestamp(),
      signature: {
        r: Hash256.fake(),
        s: Hash256.fake(),
      },
      syntheticAssetId: assetIdBucket.pick(),
      orderType: 'LimitOrderWithFees',
      collateralAssetId: AssetHash.fake(),
      positionId: randomBigInt(0, 100000),
      syntheticAmount: amountBucket.pick(),
      collateralAmount: amountBucket.pick(),
      feeAmount: amountBucket.pick(),
      starkKey: StarkKey.fake(),
    },
    partyBOrder: {
      nonce: randomBigInt(0, 100000),
      isBuyingSynthetic: true,
      expirationTimestamp: randomFutureTimestamp(),
      signature: {
        r: Hash256.fake(),
        s: Hash256.fake(),
      },
      syntheticAssetId: assetIdBucket.pick(),
      orderType: 'LimitOrderWithFees',
      collateralAssetId: AssetHash.fake(),
      positionId: randomBigInt(0, 100000),
      syntheticAmount: amountBucket.pick(),
      collateralAmount: amountBucket.pick(),
      feeAmount: amountBucket.pick(),
      starkKey: StarkKey.fake(),
    },
  }
}

export function randomL2OraclePricesTickTransaction(): OraclePricesTickL2TransactionData {
  return {
    type: 'OraclePricesTick',
    timestamp: randomTimestamp(),
    oraclePrices: repeat(randomInt(1, 10), () => randomAssetOraclePrice()),
  }
}

export function randomL2FundingTickTransaction(): FundingTickL2TransactionData {
  return {
    type: 'FundingTick',
    globalFundingIndices: {
      indices: repeat(randomInt(1, 10), () => randomFundingIndex()),
      timestamp: randomTimestamp(),
    },
  }
}

export function randomL2DeleverageTransaction(): DeleverageL2TransactionData {
  return {
    type: 'Deleverage',
    syntheticAssetId: assetIdBucket.pick(),
    collateralAmount: amountBucket.pick(),
    syntheticAmount: amountBucket.pick(),
    deleveragedPositionId: randomBigInt(0, 100000),
    deleveragerPositionId: randomBigInt(0, 100000),
    isDeleveragerBuyingSynthetic: randomInt(0, 1) === 1,
  }
}

export function randomL2LiquidateTransaction(): LiquidateL2TransactionData {
  return {
    type: 'Liquidate',
    liquidatorOrder: {
      orderType: 'LimitOrderWithFees',
      nonce: randomBigInt(0, 100000),
      starkKey: StarkKey.fake(),
      syntheticAssetId: assetIdBucket.pick(),
      syntheticAmount: amountBucket.pick(),
      collateralAssetId: AssetHash.fake(),
      collateralAmount: amountBucket.pick(),
      feeAmount: amountBucket.pick(),
      positionId: randomBigInt(0, 100000),
      expirationTimestamp: randomFutureTimestamp(),
      isBuyingSynthetic: randomInt(0, 1) === 1,
      signature: {
        r: Hash256.fake(),
        s: Hash256.fake(),
      },
    },
    liquidatedPositionId: randomBigInt(0, 100000),
    actualCollateral: amountBucket.pick(),
    actualSynthetic: amountBucket.pick(),
    actualLiquidatorFee: amountBucket.pick(),
  }
}

export function randomL2ConditionalTransferTransaction(): ConditionalTransferL2TransactionData {
  return {
    type: 'ConditionalTransfer',
    amount: amountBucket.pick(),
    nonce: randomBigInt(0, 100000),
    senderStarkKey: StarkKey.fake(),
    receiverStarkKey: StarkKey.fake(),
    senderPositionId: randomBigInt(0, 100000),
    receiverPositionId: randomBigInt(0, 100000),
    assetId: AssetHash.fake(),
    expirationTimestamp: randomFutureTimestamp(),
    signature: {
      r: Hash256.fake(),
      s: Hash256.fake(),
    },
    factRegistryAddress: EthereumAddress.fake(),
    fact: Hash256.fake(),
  }
}

export function randomL2TransferTransaction(): TransferL2TransactionData {
  return {
    type: 'Transfer',
    amount: amountBucket.pick(),
    nonce: randomBigInt(0, 100000),
    senderStarkKey: StarkKey.fake(),
    receiverStarkKey: StarkKey.fake(),
    senderPositionId: randomBigInt(0, 100000),
    receiverPositionId: randomBigInt(0, 100000),
    assetId: AssetHash.fake(),
    expirationTimestamp: randomFutureTimestamp(),
    signature: {
      r: Hash256.fake(),
      s: Hash256.fake(),
    },
  }
}

export function randomL2ForcedTransaction(): ForcedTradeL2TransactionData {
  return {
    type: 'ForcedTrade',
    starkKeyA: StarkKey.fake(),
    starkKeyB: StarkKey.fake(),
    positionIdA: randomBigInt(0, 100000),
    positionIdB: randomBigInt(0, 100000),
    collateralAssetId: AssetHash.fake(),
    syntheticAssetId: assetIdBucket.pick(),
    collateralAmount: amountBucket.pick(),
    syntheticAmount: amountBucket.pick(),
    isABuyingSynthetic: randomInt(0, 1) === 1,
    nonce: randomBigInt(0, 100000),
    isValid: true,
  }
}
