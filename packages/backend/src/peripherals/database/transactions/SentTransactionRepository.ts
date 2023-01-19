import { Hash256, StarkKey, Timestamp } from '@explorer/types'

import { Logger } from '../../../tools/Logger'
import { BaseRepository } from '../shared/BaseRepository'
import { Database } from '../shared/Database'
import {
  SentTransactionData,
  encodeSentTransactionData,
  decodeSentTransactionData,
} from './SentTransaction'

export interface SentTransactionRecord {
  transactionHash: Hash256
  starkKey: StarkKey
  vaultOrPositionId: bigint
  data: SentTransactionData
  sentTimestamp: Timestamp
  minedTimestamp?: Timestamp
  reverted: boolean
}

export class SentTransactionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    // this.getByStarkKey = this.wrapGet(this.getByStarkKey)
    this.findByTransactionHash = this.wrapFind(this.findByTransactionHash)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: {
    hash: Hash256
    timestamp: Timestamp
    data: SentTransactionData
  }) {
    const knex = await this.knex()
    const encoded = encodeSentTransactionData(record.data)
    await knex('sent_transactions').insert({
      transaction_hash: record.hash.toString(),
      type: encoded.data.type,
      stark_key: encoded.starkKey.toString(),
      sent_timestamp: BigInt(record.timestamp.toString()),
      data: encoded.data,
    })
    return record.hash
  }

  async findByTransactionHash(
    hash: Hash256
  ): Promise<SentTransactionRecord | undefined> {
    const knex = await this.knex()
    const row = await knex('sent_transactions')
      .where('transaction_hash', hash.toString())
      .first()
    if (!row) {
      return undefined
    }
    return {
      transactionHash: Hash256(row.transaction_hash),
      starkKey: StarkKey(row.stark_key),
      vaultOrPositionId: BigInt(row.vault_or_position_id),
      data: decodeSentTransactionData(row.data),
      sentTimestamp: Timestamp(row.sent_timestamp),
      minedTimestamp: row.mined_timestamp
        ? Timestamp(row.mined_timestamp)
        : undefined,
      reverted: row.reverted,
    }
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('state_transitions').delete()
  }
}
