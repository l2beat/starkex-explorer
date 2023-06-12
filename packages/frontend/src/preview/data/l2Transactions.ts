import {
  PerpetualL2ConditionalTransferTransactionData,
  PerpetualL2DeleverageTransactionData,
  PerpetualL2DepositTransactionData,
  PerpetualL2ForcedTradeTransactionData,
  PerpetualL2ForcedWithdrawalTransactionData,
  PerpetualL2FundingTickTransactionData,
  PerpetualL2LiquidateTransactionData,
  PerpetualL2OraclePricesTickTransactionData,
  PerpetualL2TradeTransactionData,
  PerpetualL2TransactionData,
  PerpetualL2TransferTransactionData,
  PerpetualL2WithdrawToAddressTransactionData,
} from '@explorer/shared'
import { AssetHash, EthereumAddress, Hash256, StarkKey } from '@explorer/types'

import { PerpetualL2TransactionEntry } from '../../view/pages/l2-transaction/common'
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

export const perpetualL2TransactionsBucket =
  new Bucket<PerpetualL2TransactionData>()
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2DepositTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2WithdrawToAddressTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2ForcedWithdrawalTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2TradeTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2ForcedTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2TransferTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2ConditionalTransferTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2LiquidateTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2DeleverageTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2FundingTickTransaction)
)
perpetualL2TransactionsBucket.addMany(
  repeat(5, randomPerpetualL2OraclePricesTickTransaction)
)

export function randomHomePerpetualL2TransactionEntry(): PerpetualL2TransactionEntry {
  return {
    transactionId: randomInt(0, 10000),
    data: perpetualL2TransactionsBucket.pick(),
    stateUpdateId: randomInt(0, 10) > 7 ? undefined : randomInt(0, 10000),
  }
}

export function randomUserPerpetualL2TransactionEntry(): PerpetualL2TransactionEntry {
  return {
    transactionId: randomInt(0, 10000),
    data: perpetualL2TransactionsBucket.pick(),
    stateUpdateId: randomInt(0, 100) > 20 ? undefined : randomInt(0, 10000),
  }
}

export function randomPerpetualL2TransactionEntry(
  data: PerpetualL2TransactionEntry['data']
): PerpetualL2TransactionEntry {
  return {
    transactionId: randomInt(0, 100000),
    stateUpdateId: randomInt(0, 10) > 7 ? undefined : randomInt(0, 100000),
    data,
  }
}

export function randomPerpetualL2DepositTransaction(): PerpetualL2DepositTransactionData {
  return {
    type: 'Deposit',
    positionId: randomBigInt(0, 100000),
    amount: amountBucket.pick(),
    starkKey: StarkKey.fake(),
  }
}

export function randomPerpetualL2WithdrawToAddressTransaction(): PerpetualL2WithdrawToAddressTransactionData {
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

export function randomPerpetualL2ForcedWithdrawalTransaction(): PerpetualL2ForcedWithdrawalTransactionData {
  return {
    type: 'ForcedWithdrawal',
    positionId: randomBigInt(0, 100000),
    amount: amountBucket.pick(),
    starkKey: StarkKey.fake(),
    isValid: true,
  }
}
export function randomPerpetualL2TradeTransaction(): PerpetualL2TradeTransactionData {
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

export function randomPerpetualL2OraclePricesTickTransaction(): PerpetualL2OraclePricesTickTransactionData {
  return {
    type: 'OraclePricesTick',
    timestamp: randomTimestamp(),
    oraclePrices: repeat(randomInt(1, 10), () => randomAssetOraclePrice()),
  }
}

export function randomPerpetualL2FundingTickTransaction(): PerpetualL2FundingTickTransactionData {
  return {
    type: 'FundingTick',
    globalFundingIndices: {
      indices: repeat(randomInt(1, 10), () => randomFundingIndex()),
      timestamp: randomTimestamp(),
    },
  }
}

export function randomPerpetualL2DeleverageTransaction(): PerpetualL2DeleverageTransactionData {
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

export function randomPerpetualL2LiquidateTransaction(): PerpetualL2LiquidateTransactionData {
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

export function randomPerpetualL2ConditionalTransferTransaction(): PerpetualL2ConditionalTransferTransactionData {
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

export function randomPerpetualL2TransferTransaction(): PerpetualL2TransferTransactionData {
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

export function randomPerpetualL2ForcedTransaction(): PerpetualL2ForcedTradeTransactionData {
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
