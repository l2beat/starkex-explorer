import { Hash256, Timestamp } from '@explorer/types'
import assert from 'assert'
import { Knex } from 'knex'

import { Logger } from '../../tools/Logger'
import { Nullable } from '../../utils/Nullable'
import { BaseRepository } from './BaseRepository'

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
    at: Nullable<Timestamp>
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

function toRow(record: Record): Row {
  const toBigInt = (timestamp?: Nullable<Timestamp>): Nullable<bigint> =>
    !timestamp ? null : BigInt(timestamp.toString())
  assert(record.notFoundRetries >= 0, 'notFoundRetries must be non-negative')
  return {
    hash: record.hash.toString(),
    mined_at: toBigInt(record.mined?.at),
    block_number: record.mined?.blockNumber || null,
    reverted_at: toBigInt(record.revertedAt),
    forgotten_at: toBigInt(record.forgottenAt),
    sent_at: toBigInt(record.sentAt),
    not_found_retries: record.notFoundRetries,
  }
}

export class TransactionStatusRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.getWaitingToBeMined = this.wrapGet(this.getWaitingToBeMined)
  }

  private waitingToBeMinedWhere() {
    return this.knex
      .whereRaw('sent_at is not null')
      .andWhereRaw('mined_at is null')
      .andWhereRaw('reverted_at is null')
      .andWhereRaw('forgotten_at is null')
  }

  async getWaitingToBeMined(): Promise<Record[]> {
    const rows = await this.knex('transaction_status').where(
      this.waitingToBeMinedWhere()
    )
    return rows.map(toRecord)
  }

  async updateWaitingToBeMined(record: Record): Promise<boolean> {
    const row = toRow(record)
    const updates = await this.knex('transaction_status')
      .update(row)
      .where('hash', '=', row.hash)
      .andWhere(this.waitingToBeMinedWhere())
    return !!updates
  }
}
