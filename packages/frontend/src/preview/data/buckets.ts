import { L2TransactionData } from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
} from '@explorer/types'
import { randomInt } from 'crypto'

import { Asset } from '../../utils/assets'
import { Bucket } from './Bucket'
import {
  randomBigInt,
  randomFutureTimestamp,
  randomTimestamp,
  repeat,
} from './utils'

export const assetIdBucket = new Bucket<AssetId>()
assetIdBucket.add(AssetId('USDC-6'))
assetIdBucket.add(AssetId('ETH-9'))
assetIdBucket.add(AssetId('BTC-10'))
assetIdBucket.add(AssetId('LINK-7'))

export const assetBucket = new Bucket<Asset>()
assetBucket.add({ hashOrId: AssetId('USDC-6') })
assetBucket.add({ hashOrId: AssetId('ETH-9') })
assetBucket.add({ hashOrId: AssetId('BTC-10') })
assetBucket.add({ hashOrId: AssetHash.fake() })
assetBucket.add({
  hashOrId: AssetHash.fake(),
  details: {
    assetHash: AssetHash.fake(),
    assetTypeHash: AssetHash.fake(),
    address: EthereumAddress('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'),
    type: 'ERC20',
    name: 'Uniswap',
    symbol: 'UNI',
    quantum: 10n ** 9n,
    decimals: 18,
    contractError: [],
  },
})
assetBucket.add({
  hashOrId: AssetHash.fake(),
  details: {
    assetHash: AssetHash.fake(),
    assetTypeHash: AssetHash.fake(),
    address: EthereumAddress('0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB'),
    type: 'ERC721',
    name: 'CRYPTOPUNKS',
    symbol: 'Ͼ',
    quantum: 1n,
    tokenId: 4431n,
    uri: undefined,
    contractError: [],
  },
})

export const amountBucket = new Bucket([
  32_000_000_000_000n,
  500_000_000n,
  7_123_456_789n,
  25_683_230_000_000n,
  94_521_020n,
])

export const changeBucket = new Bucket([
  32_000_000_000_000n,
  500_000_000n,
  -7_123_456_789n,
  -25_683_230_000_000n,
  -94_521_020n,
  0n,
])

const fakeAssetOraclePrice = () => ({
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

const fakeFundingIndex = () => ({
  syntheticAssetId: assetIdBucket.pick(),
  quantizedFundingIndex: randomInt(0, 1000000),
})

export const l2TransactionsBucket = new Bucket<L2TransactionData>()
l2TransactionsBucket.addMany(
  repeat(5, () => ({
    type: 'Deposit',
    positionId: randomBigInt(0, 100000),
    amount: amountBucket.pick(),
    starkKey: StarkKey.fake(),
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
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
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
    type: 'ForcedWithdrawal',
    positionId: randomBigInt(0, 100000),
    amount: amountBucket.pick(),
    starkKey: StarkKey.fake(),
    isValid: true,
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
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
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
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
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
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
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
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
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
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
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
    type: 'Deleverage',
    syntheticAssetId: assetIdBucket.pick(),
    collateralAmount: amountBucket.pick(),
    syntheticAmount: amountBucket.pick(),
    deleveragedPositionId: randomBigInt(0, 100000),
    deleveragerPositionId: randomBigInt(0, 100000),
    isDeleveragerBuyingSynthetic: randomInt(0, 1) === 1,
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
    type: 'FundingTick',
    globalFundingIndices: {
      indices: repeat(randomInt(1, 10), () => fakeFundingIndex()),
      timestamp: randomTimestamp(),
    },
  }))
)
l2TransactionsBucket.addMany(
  repeat(5, () => ({
    type: 'OraclePricesTick',
    timestamp: randomTimestamp(),
    oraclePrices: repeat(randomInt(1, 10), () => fakeAssetOraclePrice()),
  }))
)
