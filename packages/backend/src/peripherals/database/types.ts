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

  interface VerifierRow {
    address: string
    block_number: number
  }

  interface Tables {
    position_updates: PositionUpdateRow
    verifiers: VerifierRow
  }
}

export interface Repository<TRecord> {
  addOrUpdate(records: TRecord[]): Promise<void>
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
