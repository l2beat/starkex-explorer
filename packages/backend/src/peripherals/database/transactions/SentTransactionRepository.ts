import { Hash256, StarkKey, Timestamp } from '@explorer/types'
import { SentTransactionRow } from 'knex/types/tables'

import { Logger } from '../../../tools/Logger'
import { BaseRepository } from '../shared/BaseRepository'
import { Database } from '../shared/Database'
import {
  decodeSentTransactionData,
  encodeSentTransactionData,
  SentTransactionData,
} from './SentTransaction'

export interface SentTransactionRecord {
  transactionHash: Hash256
  starkKey: StarkKey
  vaultOrPositionId: bigint
  data: SentTransactionData
  sentTimestamp: Timestamp
  mined?: {
    timestamp: Timestamp
    blockNumber: number
    reverted: boolean
  }
}

export class SentTransactionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.updateMined = this.wrapUpdate(this.updateMined)
    this.getNotMinedHashes = this.wrapGet(this.getNotMinedHashes)
    this.getByStarkKey = this.wrapGet(this.getByStarkKey)
    this.getByPositionId = this.wrapGet(this.getByPositionId)
    this.findByTransactionHash = this.wrapFind(this.findByTransactionHash)
    this.deleteByTransactionHash = this.wrapDelete(this.deleteByTransactionHash)
    this.deleteAll = this.wrapDelete(this.deleteAll)

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

  async updateMined(
    hash: Hash256,
    mined: NonNullable<SentTransactionRecord['mined']>
  ): Promise<number> {
    const knex = await this.knex()
    const rows = await knex('sent_transactions')
      .where('transaction_hash', hash.toString())
      .update({
        mined_timestamp: BigInt(mined.timestamp.toString()),
        mined_block_number: mined.blockNumber,
        reverted: mined.reverted,
      })
    return rows
  }

  async getNotMinedHashes(): Promise<Hash256[]> {
    const knex = await this.knex()
    const rows = await knex('sent_transactions')
      .select('transaction_hash')
      .where('mined_timestamp', null)
    return rows.map((x) => Hash256(x.transaction_hash))
  }

  async getByStarkKey(starkKey: StarkKey): Promise<SentTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await knex('sent_transactions').where(
      'stark_key',
      starkKey.toString()
    )
    return rows.map(toRecord)
  }

  async getByPositionId(positionId: bigint): Promise<SentTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await knex('sent_transactions').where(
      'vault_or_position_id',
      positionId
    )
    return rows.map(toRecord)
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
    return toRecord(row)
  }

  async deleteByTransactionHash(hash: Hash256) {
    const knex = await this.knex()
    return knex('state_transitions')
      .where('transaction_hash', hash.toString())
      .delete()
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('state_transitions').delete()
  }
}

function toRecord(row: SentTransactionRow): SentTransactionRecord {
  let mined: SentTransactionRecord['mined']
  if (row.mined_timestamp !== null && row.mined_block_number !== null) {
    mined = {
      timestamp: Timestamp(row.mined_timestamp),
      blockNumber: row.mined_block_number,
      reverted: row.reverted,
    }
  }
  return {
    transactionHash: Hash256(row.transaction_hash),
    starkKey: StarkKey(row.stark_key),
    vaultOrPositionId: BigInt(row.vault_or_position_id),
    data: decodeSentTransactionData(row.data),
    sentTimestamp: Timestamp(row.sent_timestamp),
    mined,
  }
}
