import { Hash256, Timestamp } from '@explorer/types'
import { Knex } from 'knex'

import { Logger } from '../../tools/Logger'
import { Nullable } from '../../utils/Nullable'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

interface Row {
  hash: string
  sent_at: Nullable<bigint>
  mined_at: Nullable<bigint>
  reverted_at: Nullable<bigint>
  forgotten_at: Nullable<bigint>
  block_number: Nullable<number>
  not_found_retries: number
}

export const NOT_FOUND_RETRIES = 5

export interface Record {
  hash: Hash256
  sentAt: Nullable<Timestamp>
  mined?: {
    at: Timestamp
    blockNumber: number
  }
  forgottenAt: Nullable<Timestamp>
  revertedAt: Nullable<Timestamp>
  notFoundRetries: number
}

function toRecord(row: Row): Record {
  const { sent_at, mined_at, block_number } = row
  const toTimestamp = (value: bigint | null) =>
    value !== null ? Timestamp(value) : null
  return {
    hash: Hash256(row.hash),
    sentAt: toTimestamp(sent_at),
    mined:
      mined_at && block_number
        ? { at: Timestamp(mined_at), blockNumber: block_number }
        : undefined,
    revertedAt: toTimestamp(row.reverted_at),
    forgottenAt: toTimestamp(row.forgotten_at),
    notFoundRetries: row.not_found_retries,
  }
}

function timestampToBigInt(
  timestamp?: Nullable<Timestamp>
): Nullable<bigint> | undefined {
  return timestamp === undefined || timestamp === null
    ? timestamp
    : BigInt(timestamp.toString())
}

function toPartialRow(
  record: Partial<Record> & { hash: Record['hash'] }
): Partial<Row> & { hash: Row['hash'] } {
  const result: Partial<Row> & { hash: Row['hash'] } = {
    hash: record.hash.toString(),
    sent_at: timestampToBigInt(record.sentAt),
    reverted_at: timestampToBigInt(record.revertedAt),
    forgotten_at: timestampToBigInt(record.forgottenAt),
    not_found_retries: record.notFoundRetries,
  }
  if (record.mined) {
    result.mined_at = timestampToBigInt(record.mined.at)
    result.block_number = record.mined.blockNumber
  }
  return result
}

function toRow(record: Record): Row {
  return {
    sent_at: null,
    reverted_at: null,
    forgotten_at: null,
    mined_at: null,
    block_number: null,
    not_found_retries: NOT_FOUND_RETRIES,
    ...toPartialRow(record),
  }
}

export class TransactionStatusRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)
    this.getWaitingToBeMined = this.wrapGet(this.getWaitingToBeMined)
    this.add = this.wrapAdd(this.add)
    this.deleteAll = this.wrapDelete(this.deleteAll)
  }

  private waitingToBeMinedQuery(knex: Knex) {
    return knex('transaction_status')
      .whereNotNull('sent_at')
      .whereNull('mined_at')
      .whereNull('reverted_at')
      .whereNull('forgotten_at')
  }

  async add(record: Record): Promise<Hash256> {
    const knex = await this.knex()
    await knex('transaction_status').insert(toRow(record))
    return record.hash
  }

  async deleteAll(): Promise<number> {
    const knex = await this.knex()
    const deleted = await knex('transaction_status').delete()
    return deleted
  }

  async getWaitingToBeMined(): Promise<Record[]> {
    const knex = await this.knex()
    const rows = await this.waitingToBeMinedQuery(knex)
    return rows.map(toRecord)
  }

  async updateIfWaitingToBeMined(
    record: Parameters<typeof toPartialRow>[0]
  ): Promise<boolean> {
    const row = toPartialRow(record)
    const knex = await this.knex()
    const updates = await this.waitingToBeMinedQuery(knex)
      .where('hash', '=', row.hash)
      .update(row)
    return !!updates
  }
}
