import { StarkKey } from '@explorer/types'
import { L2TransactionRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'
import {
  decodeTransactionData,
  encodeTransactionData,
  TransactionData,
} from './Transaction'

interface Record<T extends TransactionData['type'] = TransactionData['type']> {
  transactionId: number
  stateUpdateId: number
  blockNumber: number
  starkKeyA: StarkKey | undefined
  starkKeyB: StarkKey | undefined
  type: T
  data: Extract<TransactionData, { type: T }>
  altIndex: number | undefined
  isReplaced: boolean
}

export type { Record as L2TransactionRecord }

export class L2TransactionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)
    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: {
    transactionId: number
    stateUpdateId: number
    blockNumber: number
    data: TransactionData
  }): Promise<number> {
    const knex = await this.knex()
    const { starkKeyA, starkKeyB, data } = encodeTransactionData(record.data)

    const [result] = await knex('l2_transactions')
      .where({ transaction_id: record.transactionId })
      .count()
    const altIndex = result?.count ? Number(result.count) - 1 : undefined

    if (altIndex === 0) {
      await knex('l2_transactions')
        .update({ is_replaced: true })
        .where({ transaction_id: record.transactionId })
    }

    const results = await knex('l2_transactions')
      .insert({
        transaction_id: record.transactionId,
        state_update_id: record.stateUpdateId,
        block_number: record.blockNumber,
        stark_key_a: starkKeyA?.toString(),
        stark_key_b: starkKeyB?.toString(),
        type: record.data.type,
        data,
        alt_index: altIndex,
      })
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async findById(id: number): Promise<Record | undefined> {
    const knex = await this.knex()
    const row = await knex('l2_transactions').where({ id }).first()

    return row ? toRecord(row) : undefined
  }

  async findLatestStateUpdateId(): Promise<number | undefined> {
    const knex = await this.knex()
    const results = await knex('l2_transactions')
      .select('state_update_id')
      .orderBy('state_update_id', 'desc')
      .limit(1)
      .first()
    return results?.state_update_id
  }

  async deleteAfterBlock(blockNumber: number) {
    const knex = await this.knex()
    return knex('l2_transactions')
      .where('block_number', '>', blockNumber)
      .delete()
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('l2_transactions').delete()
  }
}

function toRecord(row: L2TransactionRow): Record {
  return {
    transactionId: row.transaction_id,
    stateUpdateId: row.state_update_id,
    blockNumber: row.block_number,
    starkKeyA: row.stark_key_a ? StarkKey(row.stark_key_a) : undefined,
    starkKeyB: row.stark_key_b ? StarkKey(row.stark_key_b) : undefined,
    type: row.type as TransactionData['type'],
    data: decodeTransactionData(row.data),
    altIndex: row.alt_index !== null ? row.alt_index : undefined,
    isReplaced: row.is_replaced,
  }
}
