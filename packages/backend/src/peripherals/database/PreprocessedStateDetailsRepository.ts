import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedStateDetailsRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PreprocessedStateDetailsRecord {
  id: number
  stateUpdateId: number
  stateTransitionHash: Hash256
  rootHash: PedersenHash
  blockNumber: number
  timestamp: Timestamp
  assetUpdateCount: number
  forcedTransactionCount: number
}

export class PreprocessedStateDetailsRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    this.countAll = this.wrapAny(this.countAll)
    this.getPaginated = this.wrapGet(this.getPaginated)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteByStateUpdateId = this.wrapDelete(this.deleteByStateUpdateId)
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(
    row: Omit<PreprocessedStateDetailsRecord, 'id'>,
    trx: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    await knex('preprocessed_state_details').insert(
      toPreprocessedStateDetailsRow(row)
    )
    return row.stateUpdateId
  }

  async countAll(trx?: Knex.Transaction): Promise<number> {
    const knex = await this.knex(trx)
    const [result] = await knex('preprocessed_state_details').count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async getPaginated(
    { offset, limit }: { offset: number; limit: number },
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_state_details')
      .orderBy('state_update_id', 'desc')
      .offset(offset)
      .limit(limit)
    return rows.map((r) => toPreprocessedStateDetailsRecord(r))
  }

  async deleteAll(trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_state_details').delete()
  }

  async deleteByStateUpdateId(stateUpdateId: number, trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_state_details')
      .where('state_update_id', stateUpdateId)
      .delete()
  }
}

function toPreprocessedStateDetailsRecord(
  row: PreprocessedStateDetailsRow
): PreprocessedStateDetailsRecord {
  return {
    id: row.id,
    stateUpdateId: row.state_update_id,
    stateTransitionHash: Hash256(row.state_transition_hash),
    rootHash: PedersenHash(row.root_hash),
    blockNumber: row.block_number,
    timestamp: Timestamp(row.timestamp),
    assetUpdateCount: row.asset_update_count,
    forcedTransactionCount: row.forced_transaction_count,
  }
}

function toPreprocessedStateDetailsRow(
  record: Omit<PreprocessedStateDetailsRecord, 'id'>
): Omit<PreprocessedStateDetailsRow, 'id'> {
  return {
    state_update_id: record.stateUpdateId,
    state_transition_hash: record.stateTransitionHash.toString(),
    root_hash: record.rootHash.toString(),
    block_number: record.blockNumber,
    timestamp: BigInt(record.timestamp.toString()),
    asset_update_count: record.assetUpdateCount,
    forced_transaction_count: record.forcedTransactionCount,
  }
}
