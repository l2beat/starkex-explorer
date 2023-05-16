import { stringAs, stringAsBigInt, stringAsInt } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import * as z from 'zod'

const UnsignedIntAsString = z.string().regex(/^([1-9]\d*|0)$/)
const SignedIntAsString = z.string().regex(/^(-?[1-9]\d*|0)$/)
const PedersenHash = z.string().regex(/^0[a-f\d]{63}$/)
const PedersenHash0x = z.string().regex(/^0x[a-f\d]{0,63}$/)
const AssetHash0x = z.string().regex(/^0x[a-f\d]{0,63}$/)
const AssetId = z.string().regex(/^0x[a-f\d]{30}$/)

// https://github.com/starkware-libs/starkex-data-availability-committee/blob/7d72f8e05d6d9ccda5b99444f313a7248ca479b5/src/services/perpetual/public/business_logic/state_objects.py
export type PerpetualBatchResponse = z.infer<typeof PerpetualBatchResponse>
export const PerpetualBatchResponse = z.strictObject({
  update: z.union([
    z.null(),
    z.strictObject({
      prev_batch_id: z.number(),
      position_root: PedersenHash,
      order_root: PedersenHash,
      positions: z.record(
        // position_id
        UnsignedIntAsString,
        z.strictObject({
          public_key: PedersenHash0x,
          collateral_balance: SignedIntAsString,
          assets: z.record(
            AssetId,
            z.strictObject({
              cached_funding_index: SignedIntAsString,
              balance: SignedIntAsString,
            })
          ),
        })
      ),
      orders: z.record(
        // order_id
        UnsignedIntAsString,
        z.strictObject({
          fulfilled_amount: UnsignedIntAsString,
        })
      ),
    }),
  ]),
})

// https://github.com/starkware-libs/starkex-data-availability-committee/blob/7d72f8e05d6d9ccda5b99444f313a7248ca479b5/src/starkware/starkware_utils/objects/starkex_state.py
export type SpotBatchResponse = z.infer<typeof SpotBatchResponse>
export const SpotBatchResponse = z.strictObject({
  update: z.union([
    z.null(),
    z.strictObject({
      prev_batch_id: z.number(),
      order_root: PedersenHash,
      vault_root: PedersenHash,
      vaults: z.record(
        // vault_id
        UnsignedIntAsString,
        z.strictObject({
          token: AssetHash0x,
          balance: UnsignedIntAsString,
          stark_key: PedersenHash0x,
        })
      ),
      orders: z.record(
        // order_id
        UnsignedIntAsString,
        z.strictObject({
          fulfilled_amount: UnsignedIntAsString,
        })
      ),
    }),
  ]),
})

const OrderType = z.enum(['LIMIT_ORDER_WITH_FEES'])
const Signature = z.strictObject({ s: z.string(), r: z.string() })

const DepositTransaction = z.strictObject({
  position_id: stringAsBigInt(),
  public_key: PedersenHash0x,
  amount: stringAsBigInt(),
  type: z.literal('DEPOSIT'),
})

const WithdrawalToAddresTransaction = z.strictObject({
  position_id: stringAsBigInt(),
  public_key: PedersenHash0x,
  eth_address: stringAs(EthereumAddress),
  amount: stringAsBigInt(),
  nonce: stringAsBigInt(),
  expiration_timestamp: stringAsBigInt(),
  signature: Signature,
  type: z.literal('WITHDRAWAL_TO_ADDRESS'),
})

const ForcedWithdrawalTransaction = z.strictObject({
  position_id: stringAsBigInt(),
  public_key: PedersenHash0x,
  amount: stringAsBigInt(),
  is_valid: z.boolean(),
  type: z.literal('FORCED_WITHDRAWAL'),
})

const TradeTransaction = z.strictObject({
  actual_b_fee: stringAsBigInt(),
  actual_a_fee: stringAsBigInt(),
  actual_synthetic: stringAsBigInt(),
  actual_collateral: stringAsBigInt(),
  party_b_order: z.strictObject({
    nonce: stringAsBigInt(),
    is_buying_synthetic: z.boolean(),
    expiration_timestamp: stringAsBigInt(),
    signature: Signature,
    asset_id_synthetic: z.string(),
    order_type: OrderType,
    asset_id_collateral: z.string(),
    position_id: stringAsBigInt(),
    amount_synthetic: stringAsBigInt(),
    amount_fee: stringAsBigInt(),
    public_key: PedersenHash0x,
    amount_collateral: stringAsBigInt(),
  }),
  party_a_order: z.strictObject({
    nonce: stringAsBigInt(),
    is_buying_synthetic: z.boolean(),
    expiration_timestamp: stringAsBigInt(),
    signature: Signature,
    asset_id_synthetic: z.string(),
    order_type: OrderType,
    asset_id_collateral: z.string(),
    position_id: stringAsBigInt(),
    amount_synthetic: stringAsBigInt(),
    amount_fee: stringAsBigInt(),
    public_key: PedersenHash0x,
    amount_collateral: stringAsBigInt(),
  }),
  type: z.literal('TRADE'),
})

const ForcedTradeTransaction = z.strictObject({
  public_key_party_a: PedersenHash0x,
  public_key_party_b: PedersenHash0x,
  position_id_party_a: stringAsBigInt(),
  position_id_party_b: stringAsBigInt(),
  collateral_asset_id: z.string(),
  synthetic_asset_id: z.string(),
  amount_collateral: stringAsBigInt(),
  amount_synthetic: stringAsBigInt(),
  is_party_a_buying_synthetic: z.boolean(),
  nonce: stringAsBigInt(),
  is_valid: z.boolean(),
  type: z.literal('FORCED_TRADE'),
})

const TransferTransaction = z.strictObject({
  amount: stringAsBigInt(),
  nonce: stringAsBigInt(),
  sender_public_key: PedersenHash0x,
  sender_position_id: stringAsBigInt(),
  receiver_public_key: PedersenHash0x,
  receiver_position_id: stringAsBigInt(),
  asset_id: z.string(),
  expiration_timestamp: stringAsBigInt(),
  signature: Signature,
  type: z.literal('TRANSFER'),
})

const ConditionalTransferTransaction = z.strictObject({
  amount: stringAsBigInt(),
  nonce: stringAsBigInt(),
  sender_public_key: PedersenHash0x,
  sender_position_id: stringAsBigInt(),
  receiver_public_key: PedersenHash0x,
  receiver_position_id: stringAsBigInt(),
  asset_id: z.string(),
  expiration_timestamp: stringAsBigInt(),
  fact_registry_address: stringAs(EthereumAddress),
  fact: z.string(),
  signature: Signature,
  type: z.literal('CONDITIONAL_TRANSFER'),
})

const LiquidateTransaction = z.strictObject({
  liquidator_order: z.strictObject({
    order_type: OrderType,
    nonce: stringAsBigInt(),
    public_key: PedersenHash0x,
    amount_synthetic: stringAsBigInt(),
    amount_collateral: stringAsBigInt(),
    amount_fee: stringAsBigInt(),
    asset_id_synthetic: z.string(),
    asset_id_collateral: z.string(),
    position_id: stringAsBigInt(),
    is_buying_synthetic: z.boolean(),
    expiration_timestamp: stringAsBigInt(),
    signature: Signature,
  }),
  liquidated_position_id: stringAsBigInt(),
  actual_collateral: stringAsBigInt(),
  actual_synthetic: stringAsBigInt(),
  actual_liquidator_fee: stringAsBigInt(),
  type: z.literal('LIQUIDATE'),
})

const DeleverageTransaction = z.strictObject({
  amount_collateral: stringAsBigInt(),
  amount_synthetic: stringAsBigInt(),
  deleveraged_position_id: stringAsBigInt(),
  deleverager_is_buying_synthetic: z.boolean(),
  deleverager_position_id: stringAsBigInt(),
  synthetic_asset_id: z.string(),
  type: z.literal('DELEVERAGE'),
})

const FundingTickTransaction = z.strictObject({
  global_funding_indices: z.strictObject({
    indices: z.record(z.string(), stringAsInt()), // value is negative but maybe we need bigint here
    timestamp: stringAsBigInt(),
  }),
  type: z.literal('FUNDING_TICK'),
})

const OraclePricesTickTransaction = z.strictObject({
  timestamp: stringAsBigInt(),
  oracle_prices: z.record(
    z.string(),
    z.strictObject({
      signed_prices: z.record(
        PedersenHash0x,
        z.strictObject({
          external_asset_id: z.string(),
          timestamped_signature: z.strictObject({
            timestamp: stringAsBigInt(),
            signature: Signature,
          }),
          price: stringAsBigInt(),
        })
      ),
      price: stringAsBigInt(),
    })
  ),
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

const Transaction = z.discriminatedUnion('type', [
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

const TransactionInfo = z.strictObject({
  original_tx: Transaction,
  alt_txs: z.array(Transaction).nullable(),
  original_tx_id: z.number(),
  was_replaced: z.boolean(),
})

export type PerpetualTransactionBatchResponse = z.infer<
  typeof PerpetualTransactionBatchResponse
>
export const PerpetualTransactionBatchResponse = z.strictObject({
  previous_batch_id: z.number(),
  sequence_number: z.number(),
  previous_position_root: z.string(),
  previous_order_root: z.string(),
  position_root: z.string(),
  order_root: z.string(),
  txs_info: z.array(TransactionInfo),
  time_created: stringAsBigInt(),
})
