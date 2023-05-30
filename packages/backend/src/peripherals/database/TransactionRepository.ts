import { StarkKey } from '@explorer/types'
import { TransactionRow } from 'knex/types/tables'

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
}

export class TransactionRepository extends BaseRepository {
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

    const results = await knex('transactions')
      .insert({
        transaction_id: record.transactionId,
        state_update_id: record.stateUpdateId,
        block_number: record.blockNumber,
        stark_key_a: starkKeyA?.toString(),
        stark_key_b: starkKeyB?.toString(),
        type: record.data.type,
        data,
      })
      .returning('transaction_id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.transaction_id
  }

  async findById(transactionId: number): Promise<Record | undefined> {
    const knex = await this.knex()
    const row = await knex('transactions')
      .where({ transaction_id: transactionId })
      .first()

    return row ? toRecord(row) : undefined
  }

  async findLatestStateUpdateId(): Promise<number | undefined> {
    const knex = await this.knex()
    const results = await knex('transactions')
      .select('state_update_id')
      .orderBy('state_update_id', 'desc')
      .limit(1)
      .first()
    return results?.state_update_id
  }

  async deleteAfterBlock(blockNumber: number) {
    const knex = await this.knex()
    return knex('transactions').where('block_number', '>', blockNumber).delete()
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('transactions').delete()
  }
}

function toRecord(row: TransactionRow): Record {
  return {
    transactionId: row.transaction_id,
    stateUpdateId: row.state_update_id,
    blockNumber: row.block_number,
    starkKeyA: row.stark_key_a ? StarkKey(row.stark_key_a) : undefined,
    starkKeyB: row.stark_key_b ? StarkKey(row.stark_key_b) : undefined,
    type: row.type as TransactionData['type'],
    data: decodeTransactionData(row.data),
  }
}
