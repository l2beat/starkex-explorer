import { AssetId, Hash256, Timestamp } from '@explorer/types'
import { Knex } from 'knex'

import { Logger } from '../../../tools/Logger'
import { BaseRepository } from '../shared/BaseRepository'
import { Database } from '../shared/Database'

export interface CombinedForcedRecord {
  hash: Hash256
  timestamp: Timestamp
  type: 'withdraw' | 'trade'
  status: 'sent' | 'forgotten' | 'reverted' | 'mined' | 'included'
  positionIdA: bigint
  positionIdB: bigint | undefined
  isABuying: boolean
  amount: bigint
  assetId: AssetId | undefined
}

interface CombinedForcedRow {
  hash: string
  timestamp: bigint
  type: 'withdraw' | 'trade'
  status: 'sent' | 'forgotten' | 'reverted' | 'mined' | 'included'
  is_a_buying: boolean
  position_id_a: bigint
  position_id_b: bigint | null
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
    const rows = await withdrawSubQuery(knex)
      .unionAll(tradeSubQuery(knex))
      .orderBy('timestamp', 'desc')
      .limit(options.limit)
      .offset(options.offset)
    return rows.map(toRecord)
  }
}

function withdrawSubQuery(knex: Knex) {
  return (
    knex
      .select<CombinedForcedRow[]>(
        'ws1.hash',
        'ws1.timestamp as timestamp',
        knex.raw("'withdraw' AS type"),
        'ws1.status',
        knex.raw('false AS is_a_buying'),
        'wt.position_id as position_id_a',
        knex.raw('null AS position_id_b'),
        'wt.amount',
        knex.raw('null AS asset_id')
      )
      // get the latest status for each hash
      .from('forced_withdraw_statuses as ws1')
      .leftJoin('forced_withdraw_statuses as ws2', function () {
        this.on('ws1.hash', 'ws2.hash').andOn(
          'ws1.timestamp',
          '<',
          'ws2.timestamp'
        )
      })
      .where('ws2.timestamp', null)
      // get the transaction for each hash
      .join('forced_withdraw_transactions as wt', 'ws1.hash', 'wt.hash')
  )
}

function tradeSubQuery(knex: Knex) {
  return (
    knex
      .select<CombinedForcedRow[]>(
        'ts1.hash',
        'ts1.timestamp as timestamp',
        knex.raw("'trade' AS type"),
        'ts1.status',
        'tt.is_a_buying_synthetic AS is_a_buying',
        'tt.position_id_a',
        'tt.position_id_b',
        'tt.synthetic_amount',
        'tt.synthetic_asset_id'
      )
      // get the latest status for each hash
      .from('forced_trade_statuses as ts1')
      .leftJoin('forced_trade_statuses as ts2', function () {
        this.on('ts1.hash', 'ts2.hash').andOn(
          'ts1.timestamp',
          '<',
          'ts2.timestamp'
        )
      })
      .where('ts2.timestamp', null)
      // get the transaction for each hash
      .join('forced_trade_transactions as tt', 'ts1.hash', 'tt.hash')
  )
}

function toRecord(row: CombinedForcedRow): CombinedForcedRecord {
  return {
    hash: Hash256(row.hash),
    timestamp: Timestamp(row.timestamp),
    type: row.type,
    status: row.status,
    positionIdA: row.position_id_a,
    positionIdB: row.position_id_b ?? undefined,
    isABuying: row.is_a_buying,
    amount: row.amount,
    assetId: row.asset_id ? AssetId(row.asset_id) : undefined,
  }
}
