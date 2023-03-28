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
  vaultOrPositionId: bigint | undefined
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
    this.findFirstWithdrawByStarkKeyAfter = this.wrapFind(
      this.findFirstWithdrawByStarkKeyAfter
    )
    this.deleteByTransactionHash = this.wrapDelete(this.deleteByTransactionHash)
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: {
    transactionHash: Hash256
    timestamp: Timestamp
    data: SentTransactionData
  }) {
    const knex = await this.knex()
    const encoded = encodeSentTransactionData(record.data)
    await knex('sent_transactions').insert({
      transaction_hash: record.transactionHash.toString(),
      type: encoded.data.type,
      stark_key: encoded.starkKey.toString(),
      vault_or_position_id: encoded.vaultOrPositionId,
      sent_timestamp: BigInt(record.timestamp.toString()),
      reverted: false,
      data: encoded.data,
    })
    return record.transactionHash
  }

  async updateMined(
    transactionHash: Hash256,
    mined: NonNullable<SentTransactionRecord['mined']>
  ): Promise<number> {
    const knex = await this.knex()
    const rows = await knex('sent_transactions')
      .where('transaction_hash', transactionHash.toString())
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
      .orderBy('sent_timestamp', 'desc')
    return rows.map((x) => Hash256(x.transaction_hash))
  }

  async getByStarkKey(starkKey: StarkKey): Promise<SentTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await knex('sent_transactions')
      .where('stark_key', starkKey.toString())
      .orderBy('sent_timestamp', 'desc')
    return rows.map(toRecord)
  }

  async getByPositionId(positionId: bigint): Promise<SentTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await knex('sent_transactions')
      .where('vault_or_position_id', positionId)
      .orderBy('sent_timestamp', 'desc')
    return rows.map(toRecord)
  }

  async countNotMinedByPositionId(positionId: bigint): Promise<number> {
    const knex = await this.knex()
    const [result] = await knex('sent_transactions')
      .where('vault_or_position_id', positionId)
      .where('mined_timestamp', null)
      .count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
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

  async getByTransactionHashes(
    hashes: Hash256[]
  ): Promise<SentTransactionRecord[]> {
    const knex = await this.knex()
    const rows = await knex('sent_transactions').whereIn(
      'transaction_hash',
      hashes.map((x) => x.toString())
    )
    return rows.map(toRecord)
  }

  async findFirstWithdrawByStarkKeyAfter(
    starkKey: StarkKey,
    timestamp: Timestamp
  ): Promise<SentTransactionRecord | undefined> {
    const knex = await this.knex()
    const result = await knex('sent_transactions')
      .where('type', 'Withdraw')
      .where('stark_key', starkKey.toString())
      .where('sent_timestamp', '>', BigInt(timestamp.toString()))
      .where('reverted', false)
      .orderBy('sent_timestamp', 'asc')
      .first()
    return result ? toRecord(result) : undefined
  }

  async deleteByTransactionHash(hash: Hash256) {
    const knex = await this.knex()
    return knex('sent_transactions')
      .where('transaction_hash', hash.toString())
      .delete()
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('sent_transactions').delete()
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
    vaultOrPositionId:
      row.vault_or_position_id !== null
        ? BigInt(row.vault_or_position_id)
        : undefined,
    data: decodeSentTransactionData(row.data),
    sentTimestamp: Timestamp(row.sent_timestamp),
    mined,
  }
}
