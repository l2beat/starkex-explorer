import { Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedStateDetailsRow } from 'knex/types/tables'

import { PaginationOptions } from '../../model/PaginationOptions'
import { Logger } from '../../tools/Logger'
import { PreprocessedL2TransactionsStatistics } from './PreprocessedL2TransactionsStatistics'
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
  l2TransactionsStatistics?: PreprocessedL2TransactionsStatistics
  cumulativeL2TransactionsStatistics?: PreprocessedL2TransactionsStatistics
}

export class PreprocessedStateDetailsRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    this.countAll = this.wrapAny(this.countAll)
    this.findById = this.wrapFind(this.findById)
    this.getPaginated = this.wrapGet(this.getPaginated)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteByStateUpdateId = this.wrapDelete(this.deleteByStateUpdateId)
    this.update = this.wrapUpdate(this.update)
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(
    row: Omit<PreprocessedStateDetailsRecord, 'id'>,
    trx: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    const results = await knex('preprocessed_state_details')
      .insert(toPreprocessedStateDetailsRow(row))
      .returning('id')

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async countAll(trx?: Knex.Transaction): Promise<number> {
    const knex = await this.knex(trx)
    const [result] = await knex('preprocessed_state_details').count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async findById(
    id: number,
    trx?: Knex.Transaction
  ): Promise<PreprocessedStateDetailsRecord | undefined> {
    const knex = await this.knex(trx)
    const record = await knex('preprocessed_state_details')
      .where({ id })
      .first()

    return record ? toPreprocessedStateDetailsRecord(record) : undefined
  }

  async findMostRecentWithL2TransactionStatistics(trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const record = await knex('preprocessed_state_details')
      .whereNotNull('l2_transactions_statistics')
      .orderBy('state_update_id', 'desc')
      .first()

    return record ? toPreprocessedStateDetailsRecord(record) : undefined
  }

  async getAllWithoutL2TransactionStatisticsUpToStateUpdateId(
    stateUpdateId: number,
    trx: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const results = await knex('preprocessed_state_details')
      .whereNull('l2_transactions_statistics')
      .andWhere('state_update_id', '<=', stateUpdateId)
      .orderBy('state_update_id', 'asc')

    return results.map(toPreprocessedStateDetailsRecord)
  }

  async getPaginated(
    { offset, limit }: PaginationOptions,
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

  async update(
    record: Pick<PreprocessedStateDetailsRecord, 'id'> &
      Partial<PreprocessedStateDetailsRecord>,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const row = toPartialPreprocessedStateDetailsRow(record)
    return await knex('preprocessed_state_details')
      .where({ id: row.id })
      .update(row)
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
    l2TransactionsStatistics: row.l2_transactions_statistics ?? undefined,
    cumulativeL2TransactionsStatistics:
      row.cumulative_l2_transactions_statistics ?? undefined,
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
    l2_transactions_statistics: record.l2TransactionsStatistics ?? null,
    cumulative_l2_transactions_statistics:
      record.cumulativeL2TransactionsStatistics ?? null,
  }
}

function toPartialPreprocessedStateDetailsRow(
  record: Pick<PreprocessedStateDetailsRecord, 'id'> &
    Partial<PreprocessedStateDetailsRecord>
): Pick<PreprocessedStateDetailsRow, 'id'> &
  Partial<PreprocessedStateDetailsRow> {
  return {
    id: record.id,
    state_update_id: record.stateUpdateId,
    state_transition_hash: record.stateTransitionHash
      ? record.stateTransitionHash.toString()
      : undefined,
    root_hash: record.rootHash ? record.rootHash.toString() : undefined,
    block_number: record.blockNumber,
    timestamp: record.timestamp
      ? BigInt(record.timestamp.toString())
      : undefined,
    asset_update_count: record.assetUpdateCount,
    forced_transaction_count: record.forcedTransactionCount,
    l2_transactions_statistics: record.l2TransactionsStatistics,
    cumulative_l2_transactions_statistics:
      record.cumulativeL2TransactionsStatistics,
  }
}
