import { AssetId, Hash256, Timestamp } from '@explorer/types'

import { Logger } from '../../../tools/Logger'
import { BaseRepository } from '../shared/BaseRepository'
import { Database } from '../shared/Database'

export interface CombinedForcedRecord {
  hash: Hash256
  timestamp: Timestamp
  type: 'withdraw' | 'buy' | 'sell'
  status: 'sent' | 'forgotten' | 'reverted' | 'mined' | 'included'
  positionId: bigint
  amount: bigint
  assetId: AssetId | undefined
}

interface CombinedForcedRow {
  hash: string
  timestamp: bigint
  type: 'withdraw' | 'trade'
  is_buy: boolean
  status: 'sent' | 'forgotten' | 'reverted' | 'mined' | 'included'
  position_id: bigint
  amount: bigint
  asset_id: string | null
}

export class CombinedForcedRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.getPaginated = this.wrapGet(this.getPaginated)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async getPaginated(options: { limit: number; offset: number }) {
    const knex = await this.knex()
    const { rows } = (await knex.raw(
      `
      SELECT
        ws1.hash,
        ws1.status,
        ws1.timestamp as timestamp,
        'withdraw' AS type,
        false AS is_buy,
        wt.position_id,
        wt.amount,
        null AS asset_id
      FROM forced_withdraw_statuses ws1
      LEFT JOIN forced_withdraw_statuses ws2
      ON ws1.hash = ws2.hash AND ws1.timestamp < ws2.timestamp
      JOIN forced_withdraw_transactions wt
      ON ws1.hash = wt.hash
      WHERE ws2.timestamp IS NULL

      UNION ALL

      SELECT
        ts1.hash,
        ts1.status,
        ts1.timestamp as timestamp,
        'trade' AS type,
        tt.is_a_buying_synthetic AS is_buy,
        tt.position_id_a,
        tt.synthetic_amount,
        tt.synthetic_asset_id
      FROM forced_trade_statuses ts1
      LEFT JOIN forced_trade_statuses ts2
      ON ts1.hash = ts2.hash AND ts1.timestamp < ts2.timestamp
      JOIN forced_trade_transactions tt
      ON ts1.hash = tt.hash
      WHERE ts2.timestamp IS NULL

      ORDER BY timestamp DESC
      LIMIT :limit
      OFFSET :offset
      `,
      { limit: options.limit, offset: options.offset }
    )) as unknown as { rows: CombinedForcedRow[] }
    return rows.map(toRecord)
  }
}

function toRecord(row: CombinedForcedRow): CombinedForcedRecord {
  return {
    hash: Hash256(row.hash),
    timestamp: Timestamp(row.timestamp),
    type: row.type === 'withdraw' ? 'withdraw' : row.is_buy ? 'buy' : 'sell',
    status: row.status,
    positionId: row.position_id,
    amount: row.amount,
    assetId: row.asset_id ? AssetId(row.asset_id) : undefined,
  }
}
