import {
  PerpetualL2MultiTransactionData,
  PerpetualL2TransactionData,
} from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import { Knex } from 'knex'
import { L2TransactionRow } from 'knex/types/tables'

import { PaginationOptions } from '../../model/PaginationOptions'
import { Logger } from '../../tools/Logger'
import {
  decodeTransactionData,
  encodeL2TransactionData,
} from './PerpetualL2Transaction'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

interface Record<
  T extends PerpetualL2TransactionData['type'] = PerpetualL2TransactionData['type']
> {
  id: number
  transactionId: number
  stateUpdateId: number
  blockNumber: number
  parentId: number | undefined
  state: 'alternative' | 'replaced' | undefined
  starkKeyA: StarkKey | undefined
  starkKeyB: StarkKey | undefined
  data: Extract<PerpetualL2TransactionData, { type: T }>
}

interface AggregatedRecord {
  id: number
  transactionId: number
  stateUpdateId: number
  blockNumber: number
  originalTransaction: PerpetualL2TransactionData
  alternativeTransactions: PerpetualL2TransactionData[]
}

export type { Record as L2TransactionRecord }

export class L2TransactionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)
    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    this.countAllDistinctTransactionIds = this.wrapAny(
      this.countAllDistinctTransactionIds
    )
    this.countAllUserSpecific = this.wrapAny(this.countAllUserSpecific)
    this.countByTransactionId = this.wrapAny(this.countByTransactionId)
    this.getPaginated = this.wrapGet(this.getPaginated)
    this.getUserSpecificPaginated = this.wrapGet(this.getUserSpecificPaginated)
    this.findById = this.wrapFind(this.findById)
    this.findByTransactionId = this.wrapFind(this.findByTransactionId)
    this.findLatestStateUpdateId = this.wrapFind(this.findLatestStateUpdateId)
    this.deleteAfterBlock = this.wrapDelete(this.deleteAfterBlock)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: {
    transactionId: number
    stateUpdateId: number
    blockNumber: number
    data: PerpetualL2TransactionData
  }): Promise<number> {
    const knex = await this.knex()

    const count = await this.countByTransactionId(record.transactionId)
    const isAlternative = count > 0

    if (count === 1) {
      await knex('l2_transactions')
        .update({ state: 'replaced' })
        .where({ transaction_id: record.transactionId })
    }

    if (record.data.type === 'MultiTransaction') {
      return await this.addMultiTransaction(
        { ...record, data: record.data, isAlternative },
        knex
      )
    } else {
      return await this.addSingleTransaction(
        { ...record, data: record.data, isAlternative },
        knex
      )
    }
  }

  private async addSingleTransaction(
    record: {
      transactionId: number
      stateUpdateId: number
      blockNumber: number
      isAlternative: boolean
      data: Exclude<PerpetualL2TransactionData, PerpetualL2MultiTransactionData>
      parentId?: number
    },
    knex: Knex
  ) {
    const { starkKeyA, starkKeyB, data } = encodeL2TransactionData(record.data)

    const results = await knex('l2_transactions')
      .insert({
        transaction_id: record.transactionId,
        state_update_id: record.stateUpdateId,
        block_number: record.blockNumber,
        parent_id: record.parentId,
        state: record.isAlternative ? 'alternative' : null,
        stark_key_a: starkKeyA?.toString(),
        stark_key_b: starkKeyB?.toString(),
        type: record.data.type,
        data,
      })
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  private async addMultiTransaction(
    record: {
      transactionId: number
      stateUpdateId: number
      blockNumber: number
      isAlternative: boolean
      data: PerpetualL2MultiTransactionData
    },
    knex: Knex
  ) {
    const { data } = encodeL2TransactionData(record.data)

    const results = await knex('l2_transactions')
      .insert({
        transaction_id: record.transactionId,
        state_update_id: record.stateUpdateId,
        block_number: record.blockNumber,
        type: record.data.type,
        state: record.isAlternative ? 'alternative' : null,
        data,
      })
      .returning('id')

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parentId = results[0]!.id

    for (const transaction of record.data.transactions) {
      await this.addSingleTransaction(
        {
          transactionId: record.transactionId,
          stateUpdateId: record.stateUpdateId,
          blockNumber: record.blockNumber,
          isAlternative: record.isAlternative,
          data: transaction,
          parentId,
        },
        knex
      )
    }
    return parentId
  }

  async countAllDistinctTransactionIds() {
    const knex = await this.knex()
    const [result] = await knex('l2_transactions').countDistinct(
      'transaction_id'
    )
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async countAllUserSpecific(starkKey: StarkKey) {
    const knex = await this.knex()
    const [result] = await knex('l2_transactions')
      .where({
        stark_key_a: starkKey.toString(),
      })
      .orWhere({
        stark_key_b: starkKey.toString(),
      })
      .count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async countByTransactionId(transactionId: number): Promise<number> {
    const knex = await this.knex()
    const [result] = await knex('l2_transactions')
      // We filter out the child transactions because they should not be counted as separate transactions
      .where({ transaction_id: transactionId, parent_id: null })
      .count()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async getPaginated({ offset, limit }: PaginationOptions) {
    const knex = await this.knex()
    const rows = await knex('l2_transactions')
      .orderBy('id', 'desc')
      .offset(offset)
      .limit(limit)

    return rows.map(toRecord)
  }

  async getUserSpecificPaginated(
    starkKey: StarkKey,
    { offset, limit }: PaginationOptions
  ) {
    const knex = await this.knex()
    const rows = await knex('l2_transactions')
      .where({
        stark_key_a: starkKey.toString(),
      })
      .orWhere({
        stark_key_b: starkKey.toString(),
      })
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset)
    return rows.map(toRecord)
  }

  async findById(id: number): Promise<Record | undefined> {
    const knex = await this.knex()
    const row = await knex('l2_transactions').where({ id }).first()

    return row ? toRecord(row) : undefined
  }

  async findByTransactionId(id: number): Promise<AggregatedRecord | undefined> {
    const knex = await this.knex()
    const originalTransaction = await knex('l2_transactions')
      .where({ transaction_id: id, parent_id: null })
      .first()

    if (!originalTransaction) {
      return undefined
    }

    const alternativeTransactions = await knex('l2_transactions')
      .where({
        transaction_id: id,
        parent_id: null,
        state: 'alternative',
      })
      .orderBy('id', 'asc')

    return toAggregatedRecord(originalTransaction, alternativeTransactions)
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
    id: row.id,
    transactionId: row.transaction_id,
    stateUpdateId: row.state_update_id,
    blockNumber: row.block_number,
    parentId: row.parent_id ? row.parent_id : undefined,
    state: row.state ? row.state : undefined,
    starkKeyA: row.stark_key_a ? StarkKey(row.stark_key_a) : undefined,
    starkKeyB: row.stark_key_b ? StarkKey(row.stark_key_b) : undefined,
    data: decodeTransactionData(row.data),
  }
}

function toAggregatedRecord(
  transaction: L2TransactionRow,
  alternatives: L2TransactionRow[]
): AggregatedRecord {
  return {
    id: transaction.id,
    transactionId: transaction.transaction_id,
    stateUpdateId: transaction.state_update_id,
    blockNumber: transaction.block_number,
    originalTransaction: decodeTransactionData(transaction.data),
    alternativeTransactions: alternatives.map((alternative) =>
      decodeTransactionData(alternative.data)
    ),
  }
}
