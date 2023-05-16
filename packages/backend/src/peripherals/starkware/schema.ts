import * as z from 'zod'

const UnsignedIntAsString = z.string().regex(/^([1-9]\d*|0)$/)
const SignedIntAsString = z.string().regex(/^(-?[1-9]\d*|0)$/)
const PedersenHash = z.string().regex(/^0[a-f\d]{63}$/)
const Bytes32 = z.string().regex(/^[a-f\d]{64}$/)
const PedersenHash0x = z.string().regex(/^0x[a-f\d]{0,63}$/)
const AssetHash0x = z.string().regex(/^0x[a-f\d]{0,63}$/)
const AssetId = z.string().regex(/^0x[a-f\d]{30}$/)
const EthereumAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/)

// https://github.com/starkware-libs/starkex-data-availability-committee/blob/7d72f8e05d6d9ccda5b99444f313a7248ca479b5/src/services/perpetual/public/business_logic/state_objects.py
export type PerpetualBatchResponse = z.infer<typeof PerpetualBatchResponse>
export const PerpetualBatchResponse = z.strictObject({
  update: z
    .strictObject({
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
    })
    .nullable(),
})

// https://github.com/starkware-libs/starkex-data-availability-committee/blob/7d72f8e05d6d9ccda5b99444f313a7248ca479b5/src/starkware/starkware_utils/objects/starkex_state.py
export type SpotBatchResponse = z.infer<typeof SpotBatchResponse>
export const SpotBatchResponse = z.strictObject({
  update: z
    .strictObject({
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
    })
    .nullable(),
})

const OrderType = z.enum(['LIMIT_ORDER_WITH_FEES'])
const Signature = z.strictObject({ s: z.string(), r: z.string() })

const DepositTransaction = z.strictObject({
  position_id: UnsignedIntAsString,
  public_key: PedersenHash0x,
  amount: UnsignedIntAsString,
  type: z.literal('DEPOSIT'),
})

const WithdrawalToAddresTransaction = z.strictObject({
  position_id: UnsignedIntAsString,
  public_key: PedersenHash0x,
  eth_address: EthereumAddress,
  amount: UnsignedIntAsString,
  nonce: UnsignedIntAsString,
  expiration_timestamp: UnsignedIntAsString,
  signature: Signature,
  type: z.literal('WITHDRAWAL_TO_ADDRESS'),
})

const ForcedWithdrawalTransaction = z.strictObject({
  position_id: UnsignedIntAsString,
  public_key: PedersenHash0x,
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
    signature: Signature,
    asset_id_synthetic: AssetId,
    order_type: OrderType,
    asset_id_collateral: AssetHash0x,
    position_id: UnsignedIntAsString,
    amount_synthetic: UnsignedIntAsString,
    amount_fee: UnsignedIntAsString,
    public_key: PedersenHash0x,
    amount_collateral: UnsignedIntAsString,
  }),
  party_a_order: z.strictObject({
    nonce: UnsignedIntAsString,
    is_buying_synthetic: z.boolean(),
    expiration_timestamp: UnsignedIntAsString,
    signature: Signature,
    asset_id_synthetic: AssetId,
    order_type: OrderType,
    asset_id_collateral: AssetHash0x,
    position_id: UnsignedIntAsString,
    amount_synthetic: UnsignedIntAsString,
    amount_fee: UnsignedIntAsString,
    public_key: PedersenHash0x,
    amount_collateral: UnsignedIntAsString,
  }),
  type: z.literal('TRADE'),
})

const ForcedTradeTransaction = z.strictObject({
  public_key_party_a: PedersenHash0x,
  public_key_party_b: PedersenHash0x,
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
  sender_public_key: PedersenHash0x,
  sender_position_id: UnsignedIntAsString,
  receiver_public_key: PedersenHash0x,
  receiver_position_id: UnsignedIntAsString,
  // From docs: asset_id - The unique asset ID (as registered on the contract) to transfer. Currently only the collateral asset is supported.
  asset_id: AssetHash0x,
  expiration_timestamp: UnsignedIntAsString,
  signature: Signature,
  type: z.literal('TRANSFER'),
})

const ConditionalTransferTransaction = z.strictObject({
  amount: UnsignedIntAsString,
  nonce: UnsignedIntAsString,
  sender_public_key: PedersenHash0x,
  sender_position_id: UnsignedIntAsString,
  receiver_public_key: PedersenHash0x,
  receiver_position_id: UnsignedIntAsString,
  // From docs: asset_id - The unique asset ID (as registered on the contract) to transfer. Currently only the collateral asset is supported.
  asset_id: AssetHash0x,
  expiration_timestamp: UnsignedIntAsString,
  fact_registry_address: EthereumAddress,
  fact: Bytes32,
  signature: Signature,
  type: z.literal('CONDITIONAL_TRANSFER'),
})
const LiquidateTransaction = z.strictObject({
  liquidator_order: z.strictObject({
    order_type: OrderType,
    nonce: UnsignedIntAsString,
    public_key: PedersenHash0x,
    amount_synthetic: UnsignedIntAsString,
    amount_collateral: UnsignedIntAsString,
    amount_fee: UnsignedIntAsString,
    asset_id_synthetic: AssetId,
    asset_id_collateral: AssetHash0x,
    position_id: UnsignedIntAsString,
    is_buying_synthetic: z.boolean(),
    expiration_timestamp: UnsignedIntAsString,
    signature: Signature,
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
  synthetic_asset_id: z.string(),
  type: z.literal('DELEVERAGE'),
})

const FundingTickTransaction = z.strictObject({
  global_funding_indices: z.strictObject({
    indices: z.record(AssetId, SignedIntAsString), // value is negative but maybe we need bigint here
    timestamp: UnsignedIntAsString,
  }),
  type: z.literal('FUNDING_TICK'),
})

const OraclePricesTickTransaction = z.strictObject({
  timestamp: UnsignedIntAsString,
  oracle_prices: z.record(
    AssetId,
    z.strictObject({
      signed_prices: z.record(
        PedersenHash0x,
        z.strictObject({
          external_asset_id: AssetHash0x,
          timestamped_signature: z.strictObject({
            timestamp: UnsignedIntAsString,
            signature: Signature,
          }),
          price: UnsignedIntAsString,
        })
      ),
      price: UnsignedIntAsString,
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
  previous_position_root: PedersenHash,
  previous_order_root: PedersenHash,
  position_root: PedersenHash,
  order_root: PedersenHash,
  txs_info: z.array(TransactionInfo),
  time_created: UnsignedIntAsString,
})

const LiveTransactionInfo = z.strictObject({
  tx: Transaction,
  tx_id: z.number(),
})
const LiveTransaction = z.strictObject({
  apex_id: z.number(),
  tx_info: z
    .string()
    .transform((s) => LiveTransactionInfo.parse(JSON.parse(s))),
})

export type PerpetualLiveTransactionResponse = z.infer<
  typeof PerpetualLiveTransactionResponse
>
export const PerpetualLiveTransactionResponse = z.strictObject({
  count: z.number(),
  txs: z.array(LiveTransaction),
})
