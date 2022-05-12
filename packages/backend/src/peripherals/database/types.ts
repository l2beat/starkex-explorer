import { Position } from '@explorer/state'
import { json } from '@explorer/types'

export {}

declare module 'knex/types/tables' {
  interface KeyValueRow {
    key: string
    value: string
  }

  interface VerifierEventRow {
    /** surrogate key */
    id?: number
    implementation: string
    block_number: number
    name: 'ImplementationAdded' | 'Upgraded'
    initializer?: string
  }

  interface FactToPageRow {
    /** surrogate key */
    id: number
    block_number: number
    fact_hash: string
    page_hash: string
    index: number
  }

  interface PageRow {
    /** surrogate key */
    id?: number
    block_number: number
    page_hash: string
    data: string
  }

  interface StateTransitionFactRow {
    /** surrogate key */
    id?: number
    block_number: number
    hash: string
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
    fact_hash: string
    root_hash: string
    timestamp: bigint
  }

  interface PositionUpdateRow {
    state_update_id: number
    position_id: bigint
    public_key: string
    collateral_balance: bigint
    funding_timestamp: bigint
    balances: JsonB<AssetBalanceJson[]>
  }

  interface PositionRow {
    state_update_id: number
    position_id: bigint
    public_key: string
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

  interface ForcedTransactionEventRow {
    id: number
    transaction_hash: string
    transaction_type: string
    event_type: string
    block_number?: number
    timestamp: bigint
    data: json
    data_hash: string
  }

  interface Tables {
    key_values: KeyValueRow
    verifier_events: VerifierEventRow
    fact_to_pages: FactToPageRow
    pages: PageRow
    state_transition_facts: StateTransitionFactRow
    blocks: BlockRow
    merkle_nodes: MerkleNodeRow
    merkle_positions: MerklePositionsRow
    rollup_parameters: RollupParametersRow
    position_updates: PositionUpdateRow
    state_updates: StateUpdateRow
    positions: PositionRow
    prices: PriceRow
    user_registration_evens: UserRegistrationEventRow
    forced_transaction_events: ForcedTransactionEventRow
  }
}

export interface Repository<TRecord> {
  addOrUpdate?(records: TRecord[]): Promise<void>
  add?(records: TRecord[]): Promise<void>
  getAll(): Promise<TRecord[]>
  deleteAll(): Promise<void>
}

/**
 * JSON object stored in a column of type `json` or `jsonb`.
 *
 * We need to pass arrays as stringified JSON to the database — https://knexjs.org/#Schema-jsonb.
 * But, when we receive it from the database, we get the JSON object alraedy partially parsed with JSON.parse.
 */
export type JsonB<T> = T | string
