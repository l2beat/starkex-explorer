import { AssetBalances } from '../../model/AssetBalances'

export {}

declare module 'knex/types/tables' {
  interface PositionUpdateRow {
    position_id: bigint
    public_key: string
    collateral_balance: bigint
    funding_timestamp: bigint
    balances: AssetBalances.Json
  }

  interface AssetBalanceJson {
    asset_id: string
    balance: string
  }

  interface Tables {
    position_updates: PositionUpdateRow
  }
}

export interface Repository<TRecord> {
  addOrUpdate(records: TRecord[]): Promise<void>
  getAll(): Promise<TRecord[]>
  deleteAll(): Promise<void>
}
