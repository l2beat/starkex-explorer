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
}

type Status = 'sent' | 'mined' | 'reverted' | 'forgotten'

interface Sent {
  hash: Hash256
  status: 'sent'
  sentAt: Timestamp
}
interface Mined {
  hash: Hash256
  status: 'mined'
  sentAt: Nullable<Timestamp>
  minedAt: Timestamp
  blockNumber: number
}
interface Forgotten {
  hash: Hash256
  status: 'forgotten'
  sentAt: Timestamp
  forgottenAt: Timestamp
}
interface Reverted {
  hash: Hash256
  status: 'reverted'
  sentAt: Timestamp
  revertedAt: Timestamp
}
type Record = Sent | Mined | Forgotten | Reverted

function toRecord(row: Row): Record {
  const hash = Hash256(row.hash)
  const { sent_at, reverted_at, forgotten_at, mined_at, block_number } = row
  if (forgotten_at && sent_at) {
    return {
      hash,
      status: 'forgotten',
      sentAt: Timestamp(sent_at),
      forgottenAt: Timestamp(forgotten_at),
    }
  }
  if (reverted_at && sent_at) {
    return {
      hash,
      status: 'reverted',
      sentAt: Timestamp(sent_at),
      revertedAt: Timestamp(reverted_at),
    }
  }
  if (mined_at && block_number) {
    return {
      hash,
      status: 'mined',
      minedAt: Timestamp(mined_at),
      sentAt: sent_at ? Timestamp(sent_at) : null,
      blockNumber: block_number,
    }
  }
  if (sent_at) {
    return {
      hash,
      status: 'sent',
      sentAt: Timestamp(sent_at),
    }
  }
  throw new Error('Could not build transaction status record')
}

export class TransactionStatusRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.getByStatus = this.wrapGet(this.getByStatus)
  }

  private toStatusWhere(status: Status) {
    switch (status) {
      case 'sent':
        return this.knex
          .whereRaw('sent_at is not null')
          .andWhereRaw('mined_at is null')
          .andWhereRaw('reverted_at is null')
          .andWhereRaw('forgotten_at is null')
      case 'mined':
        return this.knex.whereRaw('mined_at is not null')
      case 'reverted':
        return this.knex.whereRaw('reverted_at is not null')
      case 'forgotten':
        return this.knex.whereRaw('forgotten_at is not null')
    }
  }

  async getByStatus(status: Status): Promise<Record[]> {
    const rows = await this.knex('transaction_status').where(
      this.toStatusWhere(status)
    )
    const records = rows.map(row => {
        const record = toRecord(row)
        assert(record.status === status)
        return record
    })
    return records
  }

  private async markSent(hash: Hash256, row: Partial<Row>): Promise<boolean> {
    const updates = await this.knex('transaction_status')
      .update(row)
      .where('hash', '=', hash.toString())
      .andWhere(this.toStatusWhere('sent'))
    return !!updates
  }

  async markSentAsMined(
    hash: Hash256,
    blockNumber: number,
    minedAt: Timestamp
  ): Promise<boolean> {
    return await this.markSent(hash, {
      block_number: blockNumber,
      mined_at: BigInt(String(minedAt)),
    })
  }

  async markSentAsForgotten(
    hash: Hash256,
    forgottenAt: Timestamp
  ): Promise<boolean> {
    return await this.markSent(hash, {
      forgotten_at: BigInt(String(forgottenAt)),
    })
  }

  async markSentAsReverted(hash: Hash256, revertedAt: Timestamp): Promise<boolean> {
    return await this.markSent(hash, {
      reverted_at: BigInt(String(revertedAt)),
    })
  }
}
