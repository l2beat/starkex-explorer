export {}

declare module 'knex/types/tables' {
  interface PositionUpdateRow {
    position_id: bigint
    public_key: string
    collateral_balance: bigint
    funding_timestamp: bigint
    balances: JsonB<AssetBalanceJson[]>
  }

  interface AssetBalanceJson {
    asset_id: string
    balance: string
  }

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
    id?: number
    block_number: number
    fact_hash: string
    page_hash: string
  }

  interface PageRow {
    /** surrogate key */
    id?: number
    block_number: number
    page_hash: string
    page: string
  }

  interface Tables {
    position_updates: PositionUpdateRow
    key_values: KeyValueRow
    verifier_events: VerifierEventRow
    fact_to_pages: FactToPageRow
    pages: PageRow
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
