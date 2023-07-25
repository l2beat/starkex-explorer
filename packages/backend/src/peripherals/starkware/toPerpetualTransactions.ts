import { decodeAssetId } from '@explorer/encoding'
import {
  assertUnreachable,
  PerpetualL2MultiTransactionData,
  PerpetualL2TransactionData,
} from '@explorer/shared'
import {
  AssetHash,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'

import {
  AssetOraclePrice,
  OrderTypeResponse,
  PerpetualL2Transaction as TransactionSchema,
  SignatureResponse,
  SignedOraclePrice,
} from './schema/PerpetualBatchInfoResponse'
import { PerpetualLiveL2TransactionResponse } from './schema/PerpetualLiveL2TransactionResponse'
export interface PerpetualL2Transaction {
  thirdPartyId: number
  transactionId: number
  transaction: PerpetualL2TransactionData
}

export function toPerpetualL2Transactions(
  response: PerpetualLiveL2TransactionResponse
): PerpetualL2Transaction[] {
  return response.txs.map((tx) => {
    return {
      thirdPartyId: tx.apex_id,
      transactionId: tx.tx_info.tx_id,
      transaction: toPerpetualL2TransactionData(tx.tx_info.tx),
    }
  })
}

export function toPerpetualL2TransactionData(
  tx: TransactionSchema
): PerpetualL2TransactionData {
  return tx.type === 'MULTI_TRANSACTION'
    ? toPerpetualMultiTransaction(tx)
    : toPerpetualTransaction(tx)
}

export function toPerpetualTransaction(
  tx: Exclude<TransactionSchema, { type: 'MULTI_TRANSACTION' }>
): Exclude<PerpetualL2TransactionData, PerpetualL2MultiTransactionData> {
  switch (tx.type) {
    case 'DEPOSIT': {
      return {
        positionId: BigInt(tx.position_id),
        starkKey: StarkKey.from(BigInt(tx.public_key)),
        amount: BigInt(tx.amount),
        type: 'Deposit',
      }
    }
    case 'WITHDRAWAL_TO_ADDRESS':
      return {
        positionId: BigInt(tx.position_id),
        starkKey: StarkKey.from(BigInt(tx.public_key)),
        ethereumAddress: EthereumAddress(tx.eth_address),
        amount: BigInt(tx.amount),
        nonce: BigInt(tx.nonce),
        expirationTimestamp: Timestamp.fromHours(tx.expiration_timestamp),
        signature: toPerpetualSignature(tx.signature),
        type: 'WithdrawalToAddress',
      }
    case 'FORCED_WITHDRAWAL':
      return {
        positionId: BigInt(tx.position_id),
        starkKey: StarkKey.from(BigInt(tx.public_key)),
        amount: BigInt(tx.amount),
        isValid: tx.is_valid,
        type: 'ForcedWithdrawal',
      }
    case 'TRADE':
      return {
        actualBFee: BigInt(tx.actual_b_fee),
        actualAFee: BigInt(tx.actual_a_fee),
        actualSynthetic: BigInt(tx.actual_synthetic),
        actualCollateral: BigInt(tx.actual_collateral),
        partyAOrder: {
          nonce: BigInt(tx.party_a_order.nonce),
          isBuyingSynthetic: tx.party_a_order.is_buying_synthetic,
          expirationTimestamp: Timestamp.fromHours(
            tx.party_a_order.expiration_timestamp
          ),
          signature: toPerpetualSignature(tx.party_a_order.signature),
          syntheticAssetId: decodeAssetId(tx.party_a_order.asset_id_synthetic),
          orderType: toPerpetualOrderType(tx.party_a_order.order_type),
          collateralAssetId: AssetHash(tx.party_a_order.asset_id_collateral),
          positionId: BigInt(tx.party_a_order.position_id),
          syntheticAmount: BigInt(tx.party_a_order.amount_synthetic),
          feeAmount: BigInt(tx.party_a_order.amount_fee),
          starkKey: StarkKey.from(BigInt(tx.party_a_order.public_key)),
          collateralAmount: BigInt(tx.party_a_order.amount_collateral),
        },
        partyBOrder: {
          nonce: BigInt(tx.party_b_order.nonce),
          isBuyingSynthetic: tx.party_b_order.is_buying_synthetic,
          expirationTimestamp: Timestamp.fromHours(
            tx.party_b_order.expiration_timestamp
          ),
          signature: toPerpetualSignature(tx.party_b_order.signature),
          syntheticAssetId: decodeAssetId(tx.party_b_order.asset_id_synthetic),
          orderType: toPerpetualOrderType(tx.party_b_order.order_type),
          collateralAssetId: AssetHash(tx.party_b_order.asset_id_collateral),
          positionId: BigInt(tx.party_b_order.position_id),
          syntheticAmount: BigInt(tx.party_b_order.amount_synthetic),
          feeAmount: BigInt(tx.party_b_order.amount_fee),
          starkKey: StarkKey.from(BigInt(tx.party_b_order.public_key)),
          collateralAmount: BigInt(tx.party_b_order.amount_collateral),
        },
        type: 'Trade',
      }
    case 'FORCED_TRADE':
      return {
        starkKeyA: StarkKey.from(BigInt(tx.public_key_party_a)),
        starkKeyB: StarkKey.from(BigInt(tx.public_key_party_b)),
        positionIdA: BigInt(tx.position_id_party_a),
        positionIdB: BigInt(tx.position_id_party_b),
        collateralAssetId: AssetHash(tx.collateral_asset_id),
        syntheticAssetId: decodeAssetId(tx.synthetic_asset_id),
        collateralAmount: BigInt(tx.amount_collateral),
        syntheticAmount: BigInt(tx.amount_synthetic),
        isABuyingSynthetic: tx.is_party_a_buying_synthetic,
        nonce: BigInt(tx.nonce),
        isValid: tx.is_valid,
        type: 'ForcedTrade',
      }
    case 'TRANSFER':
      return {
        amount: BigInt(tx.amount),
        nonce: BigInt(tx.nonce),
        senderStarkKey: StarkKey.from(BigInt(tx.sender_public_key)),
        receiverStarkKey: StarkKey.from(BigInt(tx.receiver_public_key)),
        senderPositionId: BigInt(tx.sender_position_id),
        receiverPositionId: BigInt(tx.receiver_position_id),
        assetId: AssetHash(tx.asset_id),
        expirationTimestamp: Timestamp.fromHours(tx.expiration_timestamp),
        signature: toPerpetualSignature(tx.signature),
        type: 'Transfer',
      }
    case 'CONDITIONAL_TRANSFER':
      return {
        amount: BigInt(tx.amount),
        nonce: BigInt(tx.nonce),
        senderStarkKey: StarkKey.from(BigInt(tx.sender_public_key)),
        receiverStarkKey: StarkKey.from(BigInt(tx.receiver_public_key)),
        senderPositionId: BigInt(tx.sender_position_id),
        receiverPositionId: BigInt(tx.receiver_position_id),
        assetId: AssetHash(tx.asset_id),
        expirationTimestamp: Timestamp.fromHours(tx.expiration_timestamp),
        factRegistryAddress: EthereumAddress(tx.fact_registry_address),
        fact: Hash256(tx.fact),
        signature: toPerpetualSignature(tx.signature),
        type: 'ConditionalTransfer',
      }
    case 'LIQUIDATE':
      return {
        liquidatorOrder: {
          orderType: toPerpetualOrderType(tx.liquidator_order.order_type),
          nonce: BigInt(tx.liquidator_order.nonce),
          starkKey: StarkKey.from(BigInt(tx.liquidator_order.public_key)),
          syntheticAmount: BigInt(tx.liquidator_order.amount_synthetic),
          syntheticAssetId: decodeAssetId(
            tx.liquidator_order.asset_id_synthetic
          ),
          collateralAmount: BigInt(tx.liquidator_order.amount_collateral),
          collateralAssetId: AssetHash(tx.liquidator_order.asset_id_collateral),
          feeAmount: BigInt(tx.liquidator_order.amount_fee),
          positionId: BigInt(tx.liquidator_order.position_id),
          isBuyingSynthetic: tx.liquidator_order.is_buying_synthetic,
          expirationTimestamp: Timestamp.fromHours(
            tx.liquidator_order.expiration_timestamp
          ),
          signature: toPerpetualSignature(tx.liquidator_order.signature),
        },
        liquidatedPositionId: BigInt(tx.liquidated_position_id),
        actualCollateral: BigInt(tx.actual_collateral),
        actualSynthetic: BigInt(tx.actual_synthetic),
        actualLiquidatorFee: BigInt(tx.actual_liquidator_fee),
        type: 'Liquidate',
      }
    case 'DELEVERAGE':
      return {
        collateralAmount: BigInt(tx.amount_collateral),
        syntheticAmount: BigInt(tx.amount_synthetic),
        deleveragedPositionId: BigInt(tx.deleveraged_position_id),
        isDeleveragerBuyingSynthetic: tx.deleverager_is_buying_synthetic,
        deleveragerPositionId: BigInt(tx.deleverager_position_id),
        syntheticAssetId: decodeAssetId(tx.synthetic_asset_id),
        type: 'Deleverage',
      }
    case 'FUNDING_TICK':
      return {
        globalFundingIndices: {
          indices: Object.entries(tx.global_funding_indices.indices).map(
            ([syntheticAssetId, quantizedFundingIndex]) => {
              return {
                syntheticAssetId: decodeAssetId(syntheticAssetId),
                quantizedFundingIndex: Number(quantizedFundingIndex),
              }
            }
          ),
          timestamp: Timestamp.fromSeconds(tx.global_funding_indices.timestamp),
        },
        type: 'FundingTick',
      }
    case 'ORACLE_PRICES_TICK':
      return {
        type: 'OraclePricesTick',
        timestamp: Timestamp.fromSeconds(tx.timestamp),
        oraclePrices: Object.entries(tx.oracle_prices).map(
          ([syntheticAssetId, oraclePrice]) =>
            toPerpetualOraclePrice(syntheticAssetId, oraclePrice)
        ),
      }
    default:
      assertUnreachable(tx)
  }
}

export function toPerpetualMultiTransaction(
  tx: Extract<TransactionSchema, { type: 'MULTI_TRANSACTION' }>
): PerpetualL2MultiTransactionData {
  return {
    type: 'MultiTransaction',
    transactions: tx.txs.map(toPerpetualTransaction),
  }
}

export function toPerpetualOrderType(orderType: OrderTypeResponse) {
  switch (orderType) {
    case 'LIMIT_ORDER_WITH_FEES':
      return 'LimitOrderWithFees' as const
    default:
      assertUnreachable(orderType)
  }
}

function toPerpetualSignedPrice(
  signerPublicKey: string,
  signedPrice: SignedOraclePrice
) {
  return {
    signerPublicKey: Hash256.from(BigInt(signerPublicKey)),
    externalAssetId: AssetHash(signedPrice.external_asset_id),
    price: BigInt(signedPrice.price),
    timestampedSignature: {
      signature: toPerpetualSignature(
        signedPrice.timestamped_signature.signature
      ),
      timestamp: Timestamp.fromSeconds(
        signedPrice.timestamped_signature.timestamp
      ),
    },
  }
}

function toPerpetualOraclePrice(
  syntheticAssetId: string,
  oraclePrice: AssetOraclePrice
) {
  return {
    syntheticAssetId: decodeAssetId(syntheticAssetId),
    price: BigInt(oraclePrice.price),
    signedPrices: Object.entries(oraclePrice.signed_prices).map(
      ([signerPublicKey, signedPrice]) =>
        toPerpetualSignedPrice(signerPublicKey, signedPrice)
    ),
  }
}

export function toPerpetualSignature(signature: SignatureResponse) {
  return {
    s: Hash256.from(BigInt(signature.s)),
    r: Hash256.from(BigInt(signature.r)),
  }
}
