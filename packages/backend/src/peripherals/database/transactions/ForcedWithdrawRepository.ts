import { Hash256, StarkKey, Timestamp } from '@explorer/types'
import {
  ForcedWithdrawStatusRow,
  ForcedWithdrawTransactionRow,
} from 'knex/types/tables'

import { Logger } from '../../../tools/Logger'
import { compareByHistory } from '../../../utils/compareByHistory'
import { BaseRepository } from '../shared/BaseRepository'
import { Database } from '../shared/Database'

export interface ForcedWithdrawTransactionRecord {
  hash: Hash256
  starkKey: StarkKey
  amount: bigint
  positionId: bigint
}

export interface ForcedWithdrawTransactionWithHistory
  extends ForcedWithdrawTransactionRecord {
  history: ForcedWithdrawStatus[]
}

export type ForcedWithdrawStatus =
  | SentStatus
  | MinedStatus
  | RevertedStatus
  | ForgottenStatus
  | IncludedStatus

export interface SentStatus {
  status: 'sent'
  timestamp: Timestamp
}

export interface MinedStatus {
  status: 'mined'
  timestamp: Timestamp
  blockNumber: number
}

export interface RevertedStatus {
  status: 'reverted'
  timestamp: Timestamp
  blockNumber: number
}

export interface ForgottenStatus {
  status: 'forgotten'
  timestamp: Timestamp
}

export interface IncludedStatus {
  status: 'included'
  timestamp: Timestamp
  blockNumber: number
  stateUpdateId: number
}

export class ForcedWithdrawRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.addSent = this.wrapAdd(this.addSent)
    this.addMined = this.wrapAdd(this.addMined)
    this.addReverted = this.wrapAdd(this.addReverted)
    this.addForgotten = this.wrapAdd(this.addForgotten)
    this.addIncluded = this.wrapAdd(this.addIncluded)
    this.findByTransactionHash = this.wrapFind(this.findByTransactionHash)
    this.getByPositionId = this.wrapGet(this.getByPositionId)
    this.getByStarkKey = this.wrapGet(this.getByStarkKey)
    this.getByStateUpdateId = this.wrapGet(this.getByStateUpdateId)
    this.getMinedNotIncluded = this.wrapGet(this.getMinedNotIncluded)
    this.getJustSentHashes = this.wrapGet(this.getJustSentHashes)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addSent(
    record: ForcedWithdrawTransactionRecord & { timestamp: Timestamp }
  ): Promise<Hash256> {
    const knex = await this.knex()
    await knex.transaction(async (trx) => {
      await trx('forced_withdraw_transactions')
        .insert(toRow(record))
        .onConflict('hash')
        .ignore()
      await trx('forced_withdraw_statuses').insert({
        hash: record.hash.toString(),
        status: 'sent',
        timestamp: BigInt(record.timestamp.toString()),
      })
    })
    return record.hash
  }

  async addMined(
    record: ForcedWithdrawTransactionRecord & {
      timestamp: Timestamp
      blockNumber: number
    }
  ): Promise<Hash256> {
    const knex = await this.knex()
    await knex.transaction(async (trx) => {
      await trx('forced_withdraw_transactions')
        .insert(toRow(record))
        .onConflict('hash')
        .ignore()
      await trx('forced_withdraw_statuses').insert({
        hash: record.hash.toString(),
        status: 'mined',
        timestamp: BigInt(record.timestamp.toString()),
        block_number: record.blockNumber,
      })
    })
    return record.hash
  }

  async addReverted(status: {
    hash: Hash256
    timestamp: Timestamp
    blockNumber: number
  }): Promise<Hash256> {
    const knex = await this.knex()
    await knex('forced_withdraw_statuses').insert({
      hash: status.hash.toString(),
      status: 'reverted',
      timestamp: BigInt(status.timestamp.toString()),
      block_number: status.blockNumber,
    })
    return status.hash
  }

  async addForgotten(status: {
    hash: Hash256
    timestamp: Timestamp
  }): Promise<Hash256> {
    const knex = await this.knex()
    await knex('forced_withdraw_statuses').insert({
      hash: status.hash.toString(),
      status: 'forgotten',
      timestamp: BigInt(status.timestamp.toString()),
    })
    return status.hash
  }

  async addIncluded(status: {
    hash: Hash256
    timestamp: Timestamp
    blockNumber: number
    stateUpdateId: number
  }): Promise<Hash256> {
    const knex = await this.knex()
    await knex('forced_withdraw_statuses').insert({
      hash: status.hash.toString(),
      status: 'included',
      timestamp: BigInt(status.timestamp.toString()),
      block_number: status.blockNumber,
      state_update_id: status.stateUpdateId,
    })
    return status.hash
  }

  async findByTransactionHash(
    hash: Hash256
  ): Promise<ForcedWithdrawTransactionWithHistory | undefined> {
    const knex = await this.knex()
    const row = await knex('forced_withdraw_transactions')
      .where('hash', hash.toString())
      .first()
    if (!row) {
      return undefined
    }
    const record = toRecord(row)
    const [result] = await this.recordsWithHistories([record])
    return result
  }

  async getByPositionId(
    positionId: bigint
  ): Promise<ForcedWithdrawTransactionWithHistory[]> {
    const knex = await this.knex()
    const rows = await knex('forced_withdraw_transactions').where(
      'position_id',
      positionId
    )
    const records = rows.map(toRecord)
    const results = await this.recordsWithHistories(records)
    return results.sort(compareByHistory)
  }

  async getByStarkKey(
    starkKey: StarkKey
  ): Promise<ForcedWithdrawTransactionWithHistory[]> {
    const knex = await this.knex()
    const rows = await knex('forced_withdraw_transactions').where(
      'stark_key',
      starkKey.toString()
    )
    const records = rows.map(toRecord)
    const results = await this.recordsWithHistories(records)
    return results.sort(compareByHistory)
  }

  async getByStateUpdateId(
    stateUpdateId: number
  ): Promise<ForcedWithdrawTransactionWithHistory[]> {
    const knex = await this.knex()
    const rows = await knex('forced_withdraw_statuses')
      .where({
        status: 'included',
        state_update_id: stateUpdateId,
      })
      .join(
        'forced_withdraw_transactions',
        'forced_withdraw_statuses.hash',
        '=',
        'forced_withdraw_transactions.hash'
      )
      .select('forced_withdraw_transactions.*')
    const records = rows.map(toRecord)
    const results = await this.recordsWithHistories(records)
    return results.sort(compareByHistory)
  }

  async getMinedNotIncluded(): Promise<ForcedWithdrawTransactionWithHistory[]> {
    const knex = await this.knex()
    const { rows } = (await knex.raw(`
      SELECT t.* FROM forced_withdraw_statuses a
      JOIN forced_withdraw_transactions t
      ON t.hash = a.hash
      WHERE a.status = 'mined'
      AND NOT EXISTS (
        SELECT 1 FROM forced_withdraw_statuses b
        WHERE b.hash = a.hash
        AND b.status = 'included'
      )
      ORDER BY a.timestamp ASC
    `)) as unknown as { rows: ForcedWithdrawTransactionRow[] }
    const records = rows.map(toRecord)
    const results = await this.recordsWithHistories(records)
    return results
  }

  async getJustSentHashes(): Promise<Hash256[]> {
    const knex = await this.knex()
    const { rows } = (await knex.raw(`
      SELECT a.hash FROM forced_withdraw_statuses a
      WHERE a.status = 'sent'
      AND NOT EXISTS (
        SELECT 1 FROM forced_withdraw_statuses b
        WHERE b.hash = a.hash
        AND b.status != 'sent'
      )
      ORDER BY a.timestamp ASC
    `)) as unknown as { rows: { hash: string }[] }
    return rows.map((row) => Hash256(row.hash))
  }

  private async recordsWithHistories(
    records: ForcedWithdrawTransactionRecord[]
  ): Promise<ForcedWithdrawTransactionWithHistory[]> {
    if (records.length === 0) {
      return []
    }
    const knex = await this.knex()
    const rows = await knex('forced_withdraw_statuses')
      .whereIn(
        'hash',
        records.map((x) => x.hash.toString())
      )
      .orderBy('timestamp', 'asc')
    return records
      .map((record) => ({
        ...record,
        history: rows
          .filter((x) => x.hash === record.hash.toString())
          .map(toHistoryRow),
      }))
      .filter((x) => x.history.length > 0)
  }

  async deleteAll() {
    const knex = await this.knex()
    const countA = await knex('forced_withdraw_transactions').delete()
    const countB = await knex('forced_withdraw_statuses').delete()
    return countA + countB
  }

  async deleteAfter(blockNumber: number) {
    const knex = await this.knex()
    return await knex('forced_withdraw_statuses')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

function toRecord(
  row: ForcedWithdrawTransactionRow
): ForcedWithdrawTransactionRecord {
  return {
    hash: Hash256(row.hash),
    starkKey: StarkKey(row.stark_key),
    amount: row.amount,
    positionId: row.position_id,
  }
}

function toRow(
  record: ForcedWithdrawTransactionRecord
): ForcedWithdrawTransactionRow {
  return {
    hash: record.hash.toString(),
    stark_key: record.starkKey.toString(),
    amount: record.amount,
    position_id: record.positionId,
  }
}

function toHistoryRow(row: ForcedWithdrawStatusRow): ForcedWithdrawStatus {
  switch (row.status) {
    case 'sent':
      return {
        status: 'sent',
        timestamp: Timestamp(row.timestamp),
      }
    case 'mined':
      if (row.block_number == null) {
        throw new Error('Corrupt database: block_number is null')
      }
      return {
        status: 'mined',
        timestamp: Timestamp(row.timestamp),
        blockNumber: row.block_number,
      }
    case 'reverted':
      if (row.block_number == null) {
        throw new Error('Corrupt database: block_number is null')
      }
      return {
        status: 'reverted',
        timestamp: Timestamp(row.timestamp),
        blockNumber: row.block_number,
      }
    case 'forgotten':
      return {
        status: 'forgotten',
        timestamp: Timestamp(row.timestamp),
      }
    case 'included':
      if (row.block_number == null) {
        throw new Error('Corrupt database: block_number is null')
      }
      if (row.state_update_id == null) {
        throw new Error('Corrupt database: state_update_id is null')
      }
      return {
        status: 'included',
        timestamp: Timestamp(row.timestamp),
        blockNumber: row.block_number,
        stateUpdateId: row.state_update_id,
      }
  }
}
