import * as z from 'zod'

const UnsignedIntAsString = z.string().regex(/^([1-9]\d*|0)$/)
const SignedIntAsString = z.string().regex(/^(-?[1-9]\d*|0)$/)
const PedersenHash = z.string().regex(/^0[a-f\d]{63}$/)
const PedersenHash0x = z.string().regex(/^0x[a-f\d]{0,64}$/)
const StarkKey = z.string().regex(/^0x0*[a-f\d]{0,63}$/)
const Bytes32 = z.string().regex(/^[a-f\d]{0,64}$/)
const AssetHash0x = z.string().regex(/^0x[a-f\d]{0,63}$/)
const AssetId = z.string().regex(/^0x[a-f\d]{30}$/)
const EthereumAddress = z.string().regex(/^0x[a-fA-F0-9]{1,40}$/)

// https://github.com/starkware-libs/starkex-data-availability-committee/blob/7d72f8e05d6d9ccda5b99444f313a7248ca479b5/src/services/perpetual/public/business_logic/state_objects.py
export type PerpetualBatchDataResponse = z.infer<
  typeof PerpetualBatchDataResponse
>
export const PerpetualBatchDataResponse = z.strictObject({
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
export type SpotBatchDataResponse = z.infer<typeof SpotBatchDataResponse>
export const SpotBatchDataResponse = z.strictObject({
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

export type OrderTypeResponse = z.infer<typeof OrderTypeResponse>
export const OrderTypeResponse = z.enum(['LIMIT_ORDER_WITH_FEES'])

export type SignatureResponse = z.infer<typeof SignatureResponse>
export const SignatureResponse = z.strictObject({
  s: PedersenHash0x,
  r: PedersenHash0x,
})

const DepositTransaction = z.strictObject({
  position_id: UnsignedIntAsString,
  public_key: StarkKey,
  amount: UnsignedIntAsString,
  type: z.literal('DEPOSIT'),
})

const WithdrawalToAddresTransaction = z.strictObject({
  position_id: UnsignedIntAsString,
  public_key: StarkKey,
  eth_address: EthereumAddress,
  amount: UnsignedIntAsString,
  nonce: UnsignedIntAsString,
  expiration_timestamp: UnsignedIntAsString,
  signature: SignatureResponse,
  type: z.literal('WITHDRAWAL_TO_ADDRESS'),
})

const ForcedWithdrawalTransaction = z.strictObject({
  position_id: UnsignedIntAsString,
  public_key: StarkKey,
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
    public_key: StarkKey,
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
    public_key: StarkKey,
    amount_collateral: UnsignedIntAsString,
  }),
  type: z.literal('TRADE'),
})

const ForcedTradeTransaction = z.strictObject({
  public_key_party_a: StarkKey,
  public_key_party_b: StarkKey,
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
  sender_public_key: StarkKey,
  sender_position_id: UnsignedIntAsString,
  receiver_public_key: StarkKey,
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
  sender_public_key: StarkKey,
  sender_position_id: UnsignedIntAsString,
  receiver_public_key: StarkKey,
  receiver_position_id: UnsignedIntAsString,
  // From docs: asset_id - The unique asset ID (as registered on the contract) to transfer. Currently only the collateral asset is supported.
  asset_id: AssetHash0x,
  expiration_timestamp: UnsignedIntAsString,
  fact_registry_address: EthereumAddress,
  fact: Bytes32,
  signature: SignatureResponse,
  type: z.literal('CONDITIONAL_TRANSFER'),
})

const LiquidateTransaction = z.strictObject({
  liquidator_order: z.strictObject({
    order_type: OrderTypeResponse,
    nonce: UnsignedIntAsString,
    public_key: StarkKey,
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
    indices: z.record(AssetId, SignedIntAsString), // value is negative but maybe we need bigint here
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
  signed_prices: z.record(PedersenHash0x, SignedOraclePrice), // TODO: Revisit this key type
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

export type Transaction = z.infer<typeof Transaction>
export const Transaction = z.discriminatedUnion('type', [
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
  original_tx: Transaction,
  alt_txs: z.array(Transaction).nullable(),
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

const PerpetualTransactionResponseTransactionInfo = z.strictObject({
  tx: Transaction,
  tx_id: z.number(),
})
const PerpetualTransactionResponseTransaction = z.strictObject({
  apex_id: z.number(),
  tx_info: z
    .string()
    .transform((s) =>
      PerpetualTransactionResponseTransactionInfo.parse(JSON.parse(s))
    ),
})

export type PerpetualTransactionResponse = z.infer<
  typeof PerpetualTransactionResponse
>
export const PerpetualTransactionResponse = z.strictObject({
  count: z.number(),
  txs: z.array(PerpetualTransactionResponseTransaction),
})
