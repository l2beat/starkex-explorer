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
  id: number
  thirdPartyId: number
  transactionId: number
  starkKeyA: StarkKey | undefined
  starkKeyB: StarkKey | undefined
  type: T
  data: Extract<TransactionData, { type: T }>
  replacedBy: number | undefined
  replacementFor: number | undefined
}

export class TransactionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)
    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: {
    thirdPartyId: number
    transactionId: number
    data: TransactionData
  }): Promise<number> {
    const knex = await this.knex()
    const { starkKeyA, starkKeyB, data } = encodeTransactionData(record.data)
    const replacedTransaction = await knex('transactions')
      .where({
        transaction_id: record.transactionId,
        replaced_by: null,
      })
      .first()

    if (replacedTransaction) {
      await knex('transactions')
        .where({
          transaction_id: record.transactionId,
          replaced_by: null,
        })
        .update({
          replaced_by: record.thirdPartyId,
        })
    }

    const results = await knex('transactions')
      .insert({
        third_party_id: record.thirdPartyId,
        transaction_id: record.transactionId,
        stark_key_a: starkKeyA?.toString(),
        stark_key_b: starkKeyB?.toString(),
        type: record.data.type,
        replacement_for:
          replacedTransaction !== undefined
            ? replacedTransaction.third_party_id
            : null,
        data,
      })
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async findById(id: number): Promise<Record | undefined> {
    const knex = await this.knex()
    const row = await knex('transactions').where({ id }).first()

    return row ? toRecord(row) : undefined
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('transactions').delete()
  }
}

function toRecord(row: TransactionRow): Record {
  return {
    id: row.id,
    thirdPartyId: row.third_party_id,
    transactionId: row.transaction_id,
    starkKeyA: row.stark_key_a ? StarkKey(row.stark_key_a) : undefined,
    starkKeyB: row.stark_key_b ? StarkKey(row.stark_key_b) : undefined,
    type: row.type as TransactionData['type'],
    data: decodeTransactionData(row.data),
    replacedBy: row.replaced_by ? row.replaced_by : undefined,
    replacementFor: row.replacement_for ? row.replacement_for : undefined,
  }
}
