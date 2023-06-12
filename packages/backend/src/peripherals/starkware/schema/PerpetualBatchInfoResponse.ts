import { z } from 'zod'

import {
  AssetHash0x,
  AssetId,
  EthereumAddress,
  Hash256,
  Hash256_0x,
  PedersenHash,
  SignedIntAsString,
  StarkKey0x,
  UnsignedIntAsString,
} from './regexes'

export type OrderTypeResponse = z.infer<typeof OrderTypeResponse>
export const OrderTypeResponse = z.enum(['LIMIT_ORDER_WITH_FEES'])

export type SignatureResponse = z.infer<typeof SignatureResponse>
export const SignatureResponse = z.strictObject({
  s: Hash256_0x,
  r: Hash256_0x,
})

const DepositTransaction = z.strictObject({
  position_id: UnsignedIntAsString,
  public_key: StarkKey0x,
  amount: UnsignedIntAsString,
  type: z.literal('DEPOSIT'),
})

const WithdrawalToAddresTransaction = z.strictObject({
  position_id: UnsignedIntAsString,
  public_key: StarkKey0x,
  eth_address: EthereumAddress,
  amount: UnsignedIntAsString,
  nonce: UnsignedIntAsString,
  expiration_timestamp: UnsignedIntAsString,
  signature: SignatureResponse,
  type: z.literal('WITHDRAWAL_TO_ADDRESS'),
})

const ForcedWithdrawalTransaction = z.strictObject({
  position_id: UnsignedIntAsString,
  public_key: StarkKey0x,
  amount: UnsignedIntAsString,
  is_valid: z.boolean(),
  type: z.literal('FORCED_WITHDRAWAL'),
})

const TradeTransaction = z.strictObject({
  actual_b_fee: UnsignedIntAsString,
  actual_a_fee: UnsignedIntAsString,
  actual_synthetic: UnsignedIntAsString,
  actual_collateral: UnsignedIntAsString,
  party_b_order: z.strictObject({
    nonce: UnsignedIntAsString,
    is_buying_synthetic: z.boolean(),
    expiration_timestamp: UnsignedIntAsString,
    signature: SignatureResponse,
    asset_id_synthetic: AssetId,
    order_type: OrderTypeResponse,
    asset_id_collateral: AssetHash0x,
    position_id: UnsignedIntAsString,
    amount_synthetic: UnsignedIntAsString,
    amount_fee: UnsignedIntAsString,
    public_key: StarkKey0x,
    amount_collateral: UnsignedIntAsString,
  }),
  party_a_order: z.strictObject({
    nonce: UnsignedIntAsString,
    is_buying_synthetic: z.boolean(),
    expiration_timestamp: UnsignedIntAsString,
    signature: SignatureResponse,
    asset_id_synthetic: AssetId,
    order_type: OrderTypeResponse,
    asset_id_collateral: AssetHash0x,
    position_id: UnsignedIntAsString,
    amount_synthetic: UnsignedIntAsString,
    amount_fee: UnsignedIntAsString,
    public_key: StarkKey0x,
    amount_collateral: UnsignedIntAsString,
  }),
  type: z.literal('TRADE'),
})

const ForcedTradeTransaction = z.strictObject({
  public_key_party_a: StarkKey0x,
  public_key_party_b: StarkKey0x,
  position_id_party_a: UnsignedIntAsString,
  position_id_party_b: UnsignedIntAsString,
  collateral_asset_id: AssetHash0x,
  synthetic_asset_id: AssetId,
  amount_collateral: UnsignedIntAsString,
  amount_synthetic: UnsignedIntAsString,
  is_party_a_buying_synthetic: z.boolean(),
  nonce: UnsignedIntAsString,
  is_valid: z.boolean(),
  type: z.literal('FORCED_TRADE'),
})

const TransferTransaction = z.strictObject({
  amount: UnsignedIntAsString,
  nonce: UnsignedIntAsString,
  sender_public_key: StarkKey0x,
  sender_position_id: UnsignedIntAsString,
  receiver_public_key: StarkKey0x,
  receiver_position_id: UnsignedIntAsString,
  // From docs: asset_id - The unique asset ID (as registered on the contract) to transfer. Currently only the collateral asset is supported.
  asset_id: AssetHash0x,
  expiration_timestamp: UnsignedIntAsString,
  signature: SignatureResponse,
  type: z.literal('TRANSFER'),
})

const ConditionalTransferTransaction = z.strictObject({
  amount: UnsignedIntAsString,
  nonce: UnsignedIntAsString,
  sender_public_key: StarkKey0x,
  sender_position_id: UnsignedIntAsString,
  receiver_public_key: StarkKey0x,
  receiver_position_id: UnsignedIntAsString,
  // From docs: asset_id - The unique asset ID (as registered on the contract) to transfer. Currently only the collateral asset is supported.
  asset_id: AssetHash0x,
  expiration_timestamp: UnsignedIntAsString,
  fact_registry_address: EthereumAddress,
  fact: Hash256,
  signature: SignatureResponse,
  type: z.literal('CONDITIONAL_TRANSFER'),
})

const LiquidateTransaction = z.strictObject({
  liquidator_order: z.strictObject({
    order_type: OrderTypeResponse,
    nonce: UnsignedIntAsString,
    public_key: StarkKey0x,
    amount_synthetic: UnsignedIntAsString,
    amount_collateral: UnsignedIntAsString,
    amount_fee: UnsignedIntAsString,
    asset_id_synthetic: AssetId,
    asset_id_collateral: AssetHash0x,
    position_id: UnsignedIntAsString,
    is_buying_synthetic: z.boolean(),
    expiration_timestamp: UnsignedIntAsString,
    signature: SignatureResponse,
  }),
  liquidated_position_id: UnsignedIntAsString,
  actual_collateral: UnsignedIntAsString,
  actual_synthetic: UnsignedIntAsString,
  actual_liquidator_fee: UnsignedIntAsString,
  type: z.literal('LIQUIDATE'),
})

const DeleverageTransaction = z.strictObject({
  amount_collateral: UnsignedIntAsString,
  amount_synthetic: UnsignedIntAsString,
  deleveraged_position_id: UnsignedIntAsString,
  deleverager_is_buying_synthetic: z.boolean(),
  deleverager_position_id: UnsignedIntAsString,
  synthetic_asset_id: AssetId,
  type: z.literal('DELEVERAGE'),
})

const FundingTickTransaction = z.strictObject({
  global_funding_indices: z.strictObject({
    indices: z.record(AssetId, SignedIntAsString),
    timestamp: UnsignedIntAsString,
  }),
  type: z.literal('FUNDING_TICK'),
})

export type SignedOraclePrice = z.infer<typeof SignedOraclePrice>
export const SignedOraclePrice = z.strictObject({
  external_asset_id: AssetHash0x,
  timestamped_signature: z.strictObject({
    timestamp: UnsignedIntAsString,
    signature: SignatureResponse,
  }),
  price: UnsignedIntAsString,
})

export type AssetOraclePrice = z.infer<typeof AssetOraclePrice>
export const AssetOraclePrice = z.strictObject({
  signed_prices: z.record(Hash256_0x, SignedOraclePrice),
  price: UnsignedIntAsString,
})

const OraclePricesTickTransaction = z.strictObject({
  oracle_prices: z.record(AssetId, AssetOraclePrice),
  timestamp: UnsignedIntAsString,
  type: z.literal('ORACLE_PRICES_TICK'),
})

const MultiTransaction = z.strictObject({
  txs: z.array(
    z.discriminatedUnion('type', [
      DepositTransaction,
      WithdrawalToAddresTransaction,
      ForcedWithdrawalTransaction,
      TradeTransaction,
      ForcedTradeTransaction,
      TransferTransaction,
      ConditionalTransferTransaction,
      LiquidateTransaction,
      DeleverageTransaction,
      FundingTickTransaction,
      OraclePricesTickTransaction,
    ])
  ),
  type: z.literal('MULTI_TRANSACTION'),
})

export type PerpetualL2Transaction = z.infer<typeof PerpetualL2Transaction>
export const PerpetualL2Transaction = z.discriminatedUnion('type', [
  DepositTransaction,
  WithdrawalToAddresTransaction,
  ForcedWithdrawalTransaction,
  TradeTransaction,
  ForcedTradeTransaction,
  TransferTransaction,
  ConditionalTransferTransaction,
  LiquidateTransaction,
  DeleverageTransaction,
  FundingTickTransaction,
  OraclePricesTickTransaction,
  MultiTransaction,
])

const PerpetualBatchInfoResponseTransactionInfo = z.strictObject({
  original_tx: PerpetualL2Transaction,
  alt_txs: z.array(PerpetualL2Transaction).nullable(),
  original_tx_id: z.number(),
  was_replaced: z.boolean(),
})

export type PerpetualBatchInfoResponse = z.infer<
  typeof PerpetualBatchInfoResponse
>

export const PerpetualBatchInfoResponse = z.strictObject({
  previous_batch_id: z.number(),
  sequence_number: z.number(),
  previous_position_root: PedersenHash,
  previous_order_root: PedersenHash,
  position_root: PedersenHash,
  order_root: PedersenHash,
  txs_info: z.array(PerpetualBatchInfoResponseTransactionInfo),
  time_created: UnsignedIntAsString,
})
