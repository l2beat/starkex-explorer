import { PerpetualL2TransactionData } from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earl'

import {
  decodeL2TransactionData,
  encodeL2TransactionData,
} from './PerpetualL2Transaction'

describe(`${encodeL2TransactionData.name} and ${decodeL2TransactionData.name}`, () => {
  it('can handle a Deposit transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'Deposit',
      starkKey: StarkKey.fake(),
      positionId: 1234n,
      amount: 5000n,
    }
    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKey,
      starkKeyB: null,
      data: {
        type: 'Deposit',
        starkKey: data.starkKey.toString(),
        positionId: data.positionId.toString(),
        amount: data.amount.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can handle a WithdrawalToAddress transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'WithdrawalToAddress',
      positionId: 1234n,
      starkKey: StarkKey.fake(),
      ethereumAddress: EthereumAddress.fake(),
      amount: 5000n,
      nonce: 1234n,
      expirationTimestamp: Timestamp(1234),
      signature: {
        r: Hash256.from(
          BigInt(
            '0x33101c1f7ee684e8653d770433c32c7f364f3f7a16a7ede3cf33f8157957085'
          )
        ),
        s: Hash256.from(
          BigInt(
            '0x3e603b99dd8e367e3e61ef9cd0125bdcf9061a122cf535c4206553507f28ce5'
          )
        ),
      },
    }
    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKey,
      starkKeyB: null,
      data: {
        type: 'WithdrawalToAddress',
        positionId: data.positionId.toString(),
        starkKey: data.starkKey.toString(),
        ethereumAddress: data.ethereumAddress.toString(),
        amount: data.amount.toString(),
        nonce: data.nonce.toString(),
        expirationTimestamp: data.expirationTimestamp.toString(),
        signature: {
          r: data.signature.r.toString(),
          s: data.signature.s.toString(),
        },
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can handle a ForcedWithdrawal transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'ForcedWithdrawal',
      positionId: 1234n,
      starkKey: StarkKey.fake(),
      amount: 1234n,
      isValid: true,
    }
    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKey,
      starkKeyB: null,
      data: {
        type: 'ForcedWithdrawal',
        positionId: data.positionId.toString(),
        starkKey: data.starkKey.toString(),
        amount: data.amount.toString(),
        isValid: data.isValid,
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can handle a Trade transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'Trade',
      actualAFee: 1234n,
      actualBFee: 1235n,
      actualCollateral: 1236n,
      actualSynthetic: 1237n,
      partyAOrder: {
        nonce: 1234n,
        isBuyingSynthetic: true,
        expirationTimestamp: Timestamp(1234),
        signature: {
          r: Hash256.from(BigInt('0x1234')),
          s: Hash256.from(BigInt('0x1234abcd5678')),
        },
        starkKey: StarkKey.fake(),
        syntheticAssetId: AssetId('ETH-9'),
        collateralAssetId: AssetHash.fake(),
        positionId: 1234n,
        orderType: 'LimitOrderWithFees',
        syntheticAmount: 1234n,
        collateralAmount: 1234n,
        feeAmount: 1234n,
      },
      partyBOrder: {
        nonce: 1234n,
        isBuyingSynthetic: false,
        expirationTimestamp: Timestamp(1234),
        signature: {
          r: Hash256(
            '0x0033101c1f7ee684e8653d770433c32c7f364f3f7a16a7ede3cf33f815795708'
          ),
          s: Hash256(
            '0x003e603b99dd8e367e3e61ef9cd0125bdcf9061a122cf535c4206553507f28ce'
          ),
        },
        starkKey: StarkKey.fake(),
        syntheticAssetId: AssetId('ETH-9'),
        collateralAssetId: AssetHash.fake(),
        positionId: 1234n,
        orderType: 'LimitOrderWithFees',
        syntheticAmount: 1234n,
        collateralAmount: 1234n,
        feeAmount: 1234n,
      },
    }
    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.partyAOrder.starkKey,
      starkKeyB: data.partyBOrder.starkKey,
      data: {
        type: 'Trade',
        actualAFee: data.actualAFee.toString(),
        actualBFee: data.actualBFee.toString(),
        actualCollateral: data.actualCollateral.toString(),
        actualSynthetic: data.actualSynthetic.toString(),
        partyAOrder: {
          nonce: data.partyAOrder.nonce.toString(),
          isBuyingSynthetic: true,
          expirationTimestamp: data.partyAOrder.expirationTimestamp.toString(),
          signature: {
            r: data.partyAOrder.signature.r.toString(),
            s: data.partyAOrder.signature.s.toString(),
          },
          starkKey: data.partyAOrder.starkKey.toString(),
          syntheticAssetId: data.partyAOrder.syntheticAssetId.toString(),
          collateralAssetId: data.partyAOrder.collateralAssetId.toString(),
          positionId: data.partyAOrder.positionId.toString(),
          orderType: 'LimitOrderWithFees',
          syntheticAmount: data.partyAOrder.syntheticAmount.toString(),
          collateralAmount: data.partyAOrder.collateralAmount.toString(),
          feeAmount: data.partyAOrder.feeAmount.toString(),
        },
        partyBOrder: {
          nonce: data.partyBOrder.nonce.toString(),
          isBuyingSynthetic: false,
          expirationTimestamp: data.partyBOrder.expirationTimestamp.toString(),
          signature: {
            r: data.partyBOrder.signature.r.toString(),
            s: data.partyBOrder.signature.s.toString(),
          },
          starkKey: data.partyBOrder.starkKey.toString(),
          syntheticAssetId: data.partyBOrder.syntheticAssetId.toString(),
          collateralAssetId: data.partyBOrder.collateralAssetId.toString(),
          positionId: data.partyBOrder.positionId.toString(),
          orderType: 'LimitOrderWithFees',
          syntheticAmount: data.partyBOrder.syntheticAmount.toString(),
          collateralAmount: data.partyBOrder.collateralAmount.toString(),
          feeAmount: data.partyBOrder.feeAmount.toString(),
        },
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can handle a ForcedTrade transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'ForcedTrade',
      starkKeyA: StarkKey.fake(),
      starkKeyB: StarkKey.fake(),
      positionIdA: 1234n,
      positionIdB: 1235n,
      collateralAssetId: AssetHash.fake(),
      syntheticAssetId: AssetId('ETH-9'),
      collateralAmount: 1236n,
      syntheticAmount: 1237n,
      isABuyingSynthetic: true,
      nonce: 1238n,
      isValid: true,
    }

    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.starkKeyA,
      starkKeyB: data.starkKeyB,
      data: {
        type: 'ForcedTrade',
        positionIdA: data.positionIdA.toString(),
        positionIdB: data.positionIdB.toString(),
        collateralAssetId: data.collateralAssetId.toString(),
        syntheticAssetId: data.syntheticAssetId.toString(),
        collateralAmount: data.collateralAmount.toString(),
        syntheticAmount: data.syntheticAmount.toString(),
        starkKeyA: data.starkKeyA.toString(),
        starkKeyB: data.starkKeyB.toString(),
        isABuyingSynthetic: data.isABuyingSynthetic,
        nonce: data.nonce.toString(),
        isValid: data.isValid,
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })

  it('can handle a Transfer transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'Transfer',
      amount: 1234n,
      nonce: 1234n,
      senderStarkKey: StarkKey.fake(),
      receiverStarkKey: StarkKey.fake(),
      senderPositionId: 1234n,
      receiverPositionId: 1234n,
      assetId: AssetHash.fake(),
      expirationTimestamp: Timestamp(1234),
      signature: {
        r: Hash256(
          '0x033101c1f7ee684e8653d770433c32c7f364f3f7a16a7ede3cf33f8157957085'
        ),
        s: Hash256(
          '0x03e603b99dd8e367e3e61ef9cd0125bdcf9061a122cf535c4206553507f28ce5'
        ),
      },
    }

    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.senderStarkKey,
      starkKeyB: data.receiverStarkKey,
      data: {
        type: 'Transfer',
        amount: data.amount.toString(),
        nonce: data.nonce.toString(),
        senderStarkKey: data.senderStarkKey.toString(),
        receiverStarkKey: data.receiverStarkKey.toString(),
        senderPositionId: data.senderPositionId.toString(),
        receiverPositionId: data.receiverPositionId.toString(),
        assetId: data.assetId.toString(),
        expirationTimestamp: data.expirationTimestamp.toString(),
        signature: {
          r: data.signature.r.toString(),
          s: data.signature.s.toString(),
        },
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can handle a ConditionalTransfer transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'ConditionalTransfer',
      amount: 1234n,
      nonce: 1234n,
      senderStarkKey: StarkKey.fake(),
      receiverStarkKey: StarkKey.fake(),
      senderPositionId: 1234n,
      receiverPositionId: 1234n,
      assetId: AssetHash.fake(),
      expirationTimestamp: Timestamp(1234),
      signature: {
        r: Hash256(
          '0x033101c1f7ee684e8653d770433c32c7f364f3f7a16a7ede3cf33f8157957085'
        ),
        s: Hash256(
          '0x03e603b99dd8e367e3e61ef9cd0125bdcf9061a122cf535c4206553507f28ce5'
        ),
      },
      factRegistryAddress: EthereumAddress.fake(),
      fact: Hash256.fake(),
    }

    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.senderStarkKey,
      starkKeyB: data.receiverStarkKey,
      data: {
        type: 'ConditionalTransfer',
        amount: data.amount.toString(),
        nonce: data.nonce.toString(),
        senderStarkKey: data.senderStarkKey.toString(),
        receiverStarkKey: data.receiverStarkKey.toString(),
        senderPositionId: data.senderPositionId.toString(),
        receiverPositionId: data.receiverPositionId.toString(),
        assetId: data.assetId.toString(),
        expirationTimestamp: data.expirationTimestamp.toString(),
        signature: {
          r: data.signature.r.toString(),
          s: data.signature.s.toString(),
        },
        factRegistryAddress: data.factRegistryAddress.toString(),
        fact: data.fact.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can handle a Liquidate transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'Liquidate',
      liquidatorOrder: {
        orderType: 'LimitOrderWithFees',
        nonce: 1234n,
        starkKey: StarkKey.fake(),
        syntheticAssetId: AssetId('ETH-9'),
        syntheticAmount: 1234n,
        collateralAssetId: AssetHash.fake(),
        collateralAmount: 1234n,
        feeAmount: 1234n,
        positionId: 1234n,
        expirationTimestamp: Timestamp(1234),
        isBuyingSynthetic: true,
        signature: {
          r: Hash256(
            '0x033101c1f7ee684e8653d770433c32c7f364f3f7a16a7ede3cf33f8157957085'
          ),
          s: Hash256(
            '0x03e603b99dd8e367e3e61ef9cd0125bdcf9061a122cf535c4206553507f28ce5'
          ),
        },
      },
      liquidatedPositionId: 1234n,
      actualCollateral: 1234n,
      actualSynthetic: 1234n,
      actualLiquidatorFee: 1234n,
    }

    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: data.liquidatorOrder.starkKey,
      starkKeyB: null,
      data: {
        type: 'Liquidate',
        liquidatorOrder: {
          orderType: data.liquidatorOrder.orderType,
          nonce: data.liquidatorOrder.nonce.toString(),
          starkKey: data.liquidatorOrder.starkKey.toString(),
          syntheticAssetId: data.liquidatorOrder.syntheticAssetId.toString(),
          syntheticAmount: data.liquidatorOrder.syntheticAmount.toString(),
          collateralAssetId: data.liquidatorOrder.collateralAssetId.toString(),
          collateralAmount: data.liquidatorOrder.collateralAmount.toString(),
          feeAmount: data.liquidatorOrder.feeAmount.toString(),
          positionId: data.liquidatorOrder.positionId.toString(),
          expirationTimestamp:
            data.liquidatorOrder.expirationTimestamp.toString(),
          isBuyingSynthetic: data.liquidatorOrder.isBuyingSynthetic,
          signature: {
            r: data.liquidatorOrder.signature.r.toString(),
            s: data.liquidatorOrder.signature.s.toString(),
          },
        },
        liquidatedPositionId: data.liquidatedPositionId.toString(),
        actualCollateral: data.actualCollateral.toString(),
        actualSynthetic: data.actualSynthetic.toString(),
        actualLiquidatorFee: data.actualLiquidatorFee.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can handle a Deleverage transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'Deleverage',
      syntheticAssetId: AssetId('ETH-9'),
      collateralAmount: 1234n,
      syntheticAmount: 1234n,
      deleveragedPositionId: 1234n,
      isDeleveragerBuyingSynthetic: true,
      deleveragerPositionId: 1234n,
    }

    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: null,
      starkKeyB: null,
      data: {
        type: 'Deleverage',
        syntheticAssetId: data.syntheticAssetId.toString(),
        collateralAmount: data.collateralAmount.toString(),
        syntheticAmount: data.syntheticAmount.toString(),
        deleveragedPositionId: data.deleveragedPositionId.toString(),
        isDeleveragerBuyingSynthetic: data.isDeleveragerBuyingSynthetic,
        deleveragerPositionId: data.deleveragerPositionId.toString(),
      },
    })
    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can handle a FundingTick transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'FundingTick',
      globalFundingIndices: {
        indices: [
          {
            syntheticAssetId: AssetId('ETH-9'),
            quantizedFundingIndex: 1234,
          },
        ],
        timestamp: Timestamp(1234),
      },
    }

    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: null,
      starkKeyB: null,
      data: {
        type: 'FundingTick',
        globalFundingIndices: {
          indices: [
            {
              syntheticAssetId:
                data.globalFundingIndices.indices[0]!.syntheticAssetId.toString(),
              quantizedFundingIndex:
                data.globalFundingIndices.indices[0]!.quantizedFundingIndex,
            },
          ],
          timestamp: data.globalFundingIndices.timestamp.toString(),
        },
      },
    })

    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
  it('can handle a OraclePricesTick transaction', () => {
    const data: PerpetualL2TransactionData = {
      type: 'OraclePricesTick',
      oraclePrices: [
        {
          syntheticAssetId: AssetId('ETH-9'),
          signedPrices: [
            {
              signerPublicKey: Hash256.fake(),
              externalAssetId: AssetHash.fake(),
              timestampedSignature: {
                signature: {
                  r: Hash256(
                    '0x033101c1f7ee684e8653d770433c32c7f364f3f7a16a7ede3cf33f8157957085'
                  ),
                  s: Hash256(
                    '0x03e603b99dd8e367e3e61ef9cd0125bdcf9061a122cf535c4206553507f28ce5'
                  ),
                },
                timestamp: Timestamp(1234),
              },
              price: 1234n,
            },
          ],
          price: 1234n,
        },
      ],
      timestamp: Timestamp(1234),
    }

    const encoded = encodeL2TransactionData(data)

    expect(encoded).toEqual({
      starkKeyA: null,
      starkKeyB: null,
      data: {
        type: 'OraclePricesTick',
        oraclePrices: data.oraclePrices.map((oraclePrice) => ({
          syntheticAssetId: oraclePrice.syntheticAssetId.toString(),
          signedPrices: oraclePrice.signedPrices.map((signedPrice) => ({
            signerPublicKey: signedPrice.signerPublicKey.toString(),
            externalAssetId: signedPrice.externalAssetId.toString(),
            timestampedSignature: {
              signature: {
                r: signedPrice.timestampedSignature.signature.r.toString(),
                s: signedPrice.timestampedSignature.signature.s.toString(),
              },
              timestamp: signedPrice.timestampedSignature.timestamp.toString(),
            },
            price: signedPrice.price.toString(),
          })),
          price: oraclePrice.price.toString(),
        })),
        timestamp: data.timestamp.toString(),
      },
    })

    expect(JSON.parse(JSON.stringify(encoded.data))).toEqual(encoded.data)

    const decoded = decodeL2TransactionData(encoded.data)
    expect(decoded).toEqual(data)
  })
})
