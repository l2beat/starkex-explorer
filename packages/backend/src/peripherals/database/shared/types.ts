import { Position } from '@explorer/state'
import { json } from '@explorer/types'

import { Nullable } from '../../../utils/Nullable'

export {}

declare module 'knex/types/tables' {
  interface KeyValueRow {
    key: string
    value: string
  }

  interface VerifierEventRow {
    /** surrogate key */
    id: number
    implementation: string
    block_number: number
    name: 'ImplementationAdded' | 'Upgraded'
    initializer?: string
  }

  interface PageMappingRow {
    /** surrogate key */
    id: number
    block_number: number
    state_transition_hash: string
    page_hash: string
    page_index: number
  }

  interface PageRow {
    /** surrogate key */
    id: number
    block_number: number
    page_hash: string
    data: string
  }

  interface StateTransitionRow {
    /** surrogate key */
    id: number
    block_number: number
    state_transition_hash: string
  }

  interface BlockRow {
    number: number
    hash: string
  }

  interface MerkleNodeRow {
    hash: string
    left_hash: string
    right_hash: string
  }

  interface MerklePositionsRow {
    hash: string
    data: ReturnType<typeof Position.prototype.toJSON>
  }

  interface RollupParametersRow {
    root_hash: string
    timestamp: bigint
    funding: Record<string, string>
  }

  interface StateUpdateRow {
    id: number
    block_number: number
    state_transition_hash: string
    root_hash: string
    timestamp: bigint
  }

  interface PositionUpdateRow {
    state_update_id: number
    position_id: bigint
    stark_key: string
    collateral_balance: bigint
    funding_timestamp: bigint
    balances: JsonB<AssetBalanceJson[]>
  }

  interface PositionRow {
    state_update_id: number
    position_id: bigint
    stark_key: string
    collateral_balance: bigint
    balances: JsonB<AssetBalanceJson[]>
  }

  interface AssetBalanceJson {
    asset_id: string
    balance: string
  }

  interface PriceRow {
    state_update_id: number
    asset_id: string
    price: bigint
  }

  interface UserRegistrationEventRow {
    id: number
    block_number: number
    stark_key: string
    eth_address: string
  }

  interface ForcedTransactionRow {
    hash: string
    finalize_hash: string
    type: string
    data: json
    data_hash: string
    state_update_id: Nullable<number>
  }

  interface TransactionStatusRow {
    hash: string
    sent_at: Nullable<bigint>
    mined_at: Nullable<bigint>
    reverted_at: Nullable<bigint>
    forgotten_at: Nullable<bigint>
    block_number: Nullable<number>
    not_found_retries: number
  }

  interface ForcedTradeOfferRow {
    id: number
    created_at: bigint
    stark_key_a: string
    position_id_a: bigint
    synthetic_asset_id: string
    collateral_amount: bigint
    synthetic_amount: bigint
    is_a_buying_synthetic: boolean
    accepted_at: Nullable<bigint>
    stark_key_b: Nullable<string>
    position_id_b: Nullable<bigint>
    submission_expiration_time: Nullable<bigint>
    nonce: Nullable<bigint>
    premium_cost: Nullable<boolean>
    signature: Nullable<string>
    transaction_hash: Nullable<string>
    cancelled_at: Nullable<bigint>
  }

  interface Tables {
    key_values: KeyValueRow
    verifier_events: VerifierEventRow
    page_mappings: PageMappingRow
    pages: PageRow
    state_transitions: StateTransitionRow
    blocks: BlockRow
    merkle_nodes: MerkleNodeRow
    merkle_positions: MerklePositionsRow
    rollup_parameters: RollupParametersRow
    position_updates: PositionUpdateRow
    state_updates: StateUpdateRow
    positions: PositionRow
    prices: PriceRow
    user_registration_evens: UserRegistrationEventRow
    forced_transactions: ForcedTransactionRow
    transaction_status: TransactionStatusRow
    user_registration_events: UserRegistrationEventRow
    forced_trade_offers: ForcedTradeOfferRow
  }
}

/**
 * JSON object stored in a column of type `json` or `jsonb`.
 *
 * We need to pass arrays as stringified JSON to the database — https://knexjs.org/#Schema-jsonb.
 * But, when we receive it from the database, we get the JSON object already partially parsed with JSON.parse.
 */
export type JsonB<T> = T | string
