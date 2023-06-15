import { json } from '@explorer/types'

import { PerpetualL2TransactionDataJson } from '../PerpetualL2Transaction'
import { SentTransactionJSON } from '../transactions/SentTransaction'
import {
  UserTransactionJSON,
  WithdrawalPerformedJSON,
} from '../transactions/UserTransaction'
import { WithdrawalAllowedJSON } from '../WithdrawalAllowed'

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

  interface MerkleLeavesRow {
    hash: string
    data: json
  }

  interface RollupParametersRow {
    root_hash: string
    timestamp: bigint
    funding: Record<string, string>
  }

  interface StateUpdateRow {
    id: number
    batch_id: number
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

  interface VaultRow {
    state_update_id: number
    vault_id: bigint
    stark_key: string
    asset_hash: string
    balance: bigint
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
    state_update_id: number | null
  }

  interface TransactionStatusRow {
    hash: string
    sent_at: bigint | null
    mined_at: bigint | null
    reverted_at: bigint | null
    forgotten_at: bigint | null
    block_number: number | null
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
    accepted_at: bigint | null
    stark_key_b: string | null
    position_id_b: bigint | null
    submission_expiration_time: bigint | null
    nonce: bigint | null
    premium_cost: boolean | null
    signature: string | null
    transaction_hash: string | null
    cancelled_at: bigint | null
  }

  interface SentTransactionRow {
    transaction_hash: string
    type: string
    stark_key: string
    vault_or_position_id: bigint | null
    data: SentTransactionJSON
    sent_timestamp: bigint
    mined_timestamp: bigint | null
    mined_block_number: number | null
    reverted: boolean
  }

  interface UserTransactionRow {
    id: number // surrogate key
    type: string
    transaction_hash: string
    stark_key_a: string
    stark_key_b: string | null
    vault_or_position_id_a: bigint | null
    vault_or_position_id_b: bigint | null
    data: UserTransactionJSON
    block_number: number
    timestamp: bigint
  }

  interface IncludedForcedRequestRow {
    transaction_hash: string
    block_number: number
    timestamp: bigint
    state_update_id: number
  }

  interface AssetRegistrationRow {
    asset_type_hash: string
    type: string
    quantum: string
    address: string | null
    name: string | null
    symbol: string | null
    decimals: number | null
    contract_error: json
  }

  interface AssetDetailsRow {
    asset_hash: string
    asset_type_hash: string
    type: string
    quantum: string
    address: string | null
    name: string | null
    symbol: string | null
    decimals: number | null
    token_id: string | null
    uri: string | null
    minting_blob: string | null
    contract_error: json
  }

  interface PreprocessedStateUpdateRow {
    state_update_id: number
    state_transition_hash: string
  }

  interface PreprocessedAssetHistoryRow {
    id: number
    state_update_id: number
    block_number: number
    timestamp: bigint
    stark_key: string
    position_or_vault_id: bigint
    asset_hash_or_id: string
    balance: bigint
    prev_balance: bigint
    price: bigint | null
    prev_price: bigint | null
    is_current: boolean
    prev_history_id: number | null
  }

  interface PreprocessedStateDetailsRow {
    id: number
    state_update_id: number
    state_transition_hash: string
    root_hash: string
    block_number: number
    timestamp: bigint
    asset_update_count: number
    forced_transaction_count: number
  }

  interface WithdrawableAssetRow {
    id: number
    block_number: number
    timestamp: bigint
    stark_key: string
    asset_hash: string
    balance_delta: bigint
    transaction_hash: string
    data: WithdrawalAllowedJSON | WithdrawalPerformedJSON
  }

  interface PreprocessedUserStatisticsRow {
    id: number
    state_update_id: number
    block_number: number
    timestamp: bigint
    stark_key: string
    asset_count: number
    balance_change_count: number
    prev_history_id: number | null
  }

  interface L2TransactionRow {
    id: number
    transaction_id: number
    state_update_id: number
    block_number: number
    parent_id: number | null
    state: 'alternative' | 'replaced' | null
    stark_key_a: string | null
    stark_key_b: string | null
    data: PerpetualL2TransactionDataJson
    type: string
  }

  interface Tables {
    key_values: KeyValueRow
    verifier_events: VerifierEventRow
    page_mappings: PageMappingRow
    pages: PageRow
    state_transitions: StateTransitionRow
    blocks: BlockRow
    merkle_nodes: MerkleNodeRow
    merkle_leaves: MerkleLeavesRow
    rollup_parameters: RollupParametersRow
    position_updates: PositionUpdateRow
    state_updates: StateUpdateRow
    positions: PositionRow
    prices: PriceRow
    user_registration_events: UserRegistrationEventRow
    forced_transactions: ForcedTransactionRow
    transaction_status: TransactionStatusRow
    forced_trade_offers: ForcedTradeOfferRow
    vaults: VaultRow
    sent_transactions: SentTransactionRow
    user_transactions: UserTransactionRow
    included_forced_requests: IncludedForcedRequestRow
    asset_registrations: AssetRegistrationRow
    asset_details: AssetDetailsRow
    preprocessed_state_updates: PreprocessedStateUpdateRow
    preprocessed_asset_history: PreprocessedAssetHistoryRow
    preprocessed_state_details: PreprocessedStateDetailsRow
    withdrawable_assets: WithdrawableAssetRow
    preprocessed_user_statistics: PreprocessedUserStatisticsRow
    l2_transactions: L2TransactionRow
  }
}

/**
 * JSON object stored in a column of type `json` or `jsonb`.
 *
 * We need to pass arrays as stringified JSON to the database — https://knexjs.org/#Schema-jsonb.
 * But, when we receive it from the database, we get the JSON object already partially parsed with JSON.parse.
 */
export type JsonB<T> = T | string
