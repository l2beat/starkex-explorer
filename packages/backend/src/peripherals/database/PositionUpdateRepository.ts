import { AssetId } from '@explorer/encoding'
import { Knex } from 'knex'
import { AssetBalanceJson, PositionUpdateRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface PositionUpdateRecord {
  stateUpdateId: number
  positionId: bigint
  publicKey: string
  collateralBalance: bigint
  fundingTimestamp: bigint
  balances: AssetBalance[]
}

export interface AssetBalance {
  assetId: AssetId
  balance: bigint
}

export class PositionUpdateRepository
  implements Repository<PositionUpdateRecord>
{
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async addOrUpdate(records: PositionUpdateRecord[]) {
    if (records.length === 0) {
      this.logger.debug({ method: 'addOrUpdate', rows: 0 })
      return
    }

    const rows: PositionUpdateRow[] = records.map(toRow)
    await this.knex('position_updates')
      .insert(rows)
      .onConflict(['position_id', 'state_update_id'])
      .merge()

    this.logger.debug({ method: 'addOrUpdate', rows: rows.length })
  }

  async getAll() {
    const rows = await this.knex('position_updates').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async getAllByPositionId(positionId: bigint) {
    const rows = await this.knex('position_updates')
      .where('position_id', positionId)
      .select('*')
    this.logger.debug({ method: 'getAllByPositionId', rows: rows.length })
    return rows.map(toRecord)
  }

  async deleteAll() {
    await this.knex('position_updates').delete()
    this.logger.debug({ method: 'deleteAll' })
  }
}

function toRow(record: PositionUpdateRecord): PositionUpdateRow {
  const balances = record.balances.map(
    (x): AssetBalanceJson => ({
      asset_id: x.assetId.toString(),
      balance: x.balance.toString(),
    })
  )

  return {
    state_update_id: record.stateUpdateId,
    position_id: record.positionId,
    public_key: record.publicKey,
    collateral_balance: record.collateralBalance,
    funding_timestamp: record.fundingTimestamp,
    balances: JSON.stringify(balances),
  }
}

function toRecord(row: PositionUpdateRow): PositionUpdateRecord {
  return {
    stateUpdateId: row.state_update_id,
    positionId: row.position_id,
    publicKey: row.public_key,
    collateralBalance: row.collateral_balance,
    fundingTimestamp: row.funding_timestamp,
    balances: (typeof row.balances === 'string'
      ? (JSON.parse(row.balances) as AssetBalanceJson[])
      : row.balances
    ).map((x) => ({
      assetId: AssetId(x.asset_id),
      balance: BigInt(x.balance),
    })),
  }
}
