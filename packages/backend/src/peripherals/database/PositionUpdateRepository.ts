import { Knex } from 'knex'
import { PositionUpdateRow } from 'knex/types/tables'

import { AssetBalances } from '../../model/AssetBalances'
import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface PositionUpdateRecord {
  positionId: bigint
  publicKey: string
  collateralBalance: bigint
  fundingTimestamp: bigint
  balances: AssetBalances
}

export interface AssetBalance {
  assetId: bigint
  balance: bigint
}

export class PositionUpdateRepository
  implements Repository<PositionUpdateRecord>
{
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = this.logger.for(this)
  }

  async addOrUpdate(records: PositionUpdateRecord[]) {
    const rows: PositionUpdateRow[] = records.map(toRow)
    await this.knex('position_updates')
      .insert(rows)
      .onConflict(['position_id']) // @todo
      .merge()
    this.logger.debug({ method: 'add', rows: rows.length })
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
  return {
    position_id: record.positionId,
    public_key: record.publicKey,
    collateral_balance: record.collateralBalance,
    funding_timestamp: record.fundingTimestamp,
    balances: AssetBalances.from(record.balances).stringify(),
  }
}

function toRecord(row: PositionUpdateRow): PositionUpdateRecord {
  return {
    positionId: row.position_id,
    publicKey: row.public_key,
    collateralBalance: row.collateral_balance,
    fundingTimestamp: row.funding_timestamp,
    balances: AssetBalances.parse(row.balances),
  }
}
