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
  decodeL2TransactionData,
  encodeL2TransactionData,
} from './PerpetualL2Transaction'
import {
  PreprocessedL2TransactionsStatistics,
  PreprocessedUserL2TransactionsStatistics,
} from './PreprocessedL2TransactionsStatistics'
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

export type {
  AggregatedRecord as AggregatedL2TransactionRecord,
  Record as L2TransactionRecord,
}

export class L2TransactionRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)
    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    this.countAllDistinctTransactionIds = this.wrapAny(
      this.countAllDistinctTransactionIds
    )
    this.countAllDistinctTransactionIdsByStateUpdateId = this.wrapAny(
      this.countAllDistinctTransactionIdsByStateUpdateId
    )
    this.countAllUserSpecific = this.wrapAny(this.countAllUserSpecific)
    this.countByTransactionId = this.wrapAny(this.countByTransactionId)
    this.getStatisticsByStateUpdateId = this.wrapAny(
      this.getStatisticsByStateUpdateId
    )
    this.getStatisticsByStateUpdateIdAndStarkKey = this.wrapAny(
      this.getStatisticsByStateUpdateIdAndStarkKey
    )
    this.getPaginatedWithoutMulti = this.wrapGet(this.getPaginatedWithoutMulti)
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

  async countAllDistinctTransactionIdsByStateUpdateId(stateUpdateId: number) {
    const knex = await this.knex()
    const [result] = await knex('l2_transactions')
      .where({ state_update_id: stateUpdateId })
      .countDistinct('transaction_id')
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

  async getStatisticsByStateUpdateId(
    stateUpdateId: number,
    trx?: Knex.Transaction
  ): Promise<PreprocessedL2TransactionsStatistics> {
    const knex = await this.knex(trx)

    const countGroupedByType = (await knex('l2_transactions')
      .select('type')
      .where({ state_update_id: stateUpdateId })
      .count()
      .groupBy('type')) as {
      type: PerpetualL2TransactionData['type']
      count: number
    }[]

    const [replaced] = await knex('l2_transactions')
      .where({ state_update_id: stateUpdateId })
      .andWhere({ state: 'replaced' })
      .count()

    return toPreprocessedL2TransactionsStatistics(
      countGroupedByType,
      Number(replaced?.count ?? 0)
    )
  }

  async getStatisticsByStateUpdateIdAndStarkKey(
    stateUpdateId: number,
    starkKey: StarkKey,
    trx?: Knex.Transaction
  ): Promise<PreprocessedUserL2TransactionsStatistics> {
    const knex = await this.knex(trx)
    const countGroupedByType = (await knex('l2_transactions')
      .select('type')
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .where((qB) =>
        qB
          .where({ stark_key_a: starkKey.toString() })
          .orWhere({ stark_key_b: starkKey.toString() })
      )
      .andWhere({ state_update_id: stateUpdateId })
      .count()
      .groupBy('type')) as {
      type: Exclude<PerpetualL2TransactionData['type'], 'MultiTransaction'>
      count: number
    }[]

    const [replaced] = await knex('l2_transactions')
      .where({ state: 'replaced' })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .andWhere((qB) =>
        qB
          .where({ stark_key_a: starkKey.toString() })
          .orWhere({ stark_key_b: starkKey.toString() })
      )
      .andWhere({ state_update_id: stateUpdateId })
      .count()
    return toPreprocessedUserL2TransactionsStatistics(
      countGroupedByType,
      Number(replaced?.count ?? 0)
    )
  }

  async getPaginatedWithoutMulti({ offset, limit }: PaginationOptions) {
    const knex = await this.knex()
    const rows = await knex('l2_transactions')
      // We filter out the multi transactions because we show the child transactions instead
      .whereNot({ type: 'MultiTransaction' })
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
    // We do not need to filter multi transactions because they are not user specific
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

  async getPaginatedWithoutMultiByStateUpdateId(
    stateUpdateId: number,
    { offset, limit }: PaginationOptions
  ) {
    const knex = await this.knex()
    const rows = await knex('l2_transactions')
      .where({ state_update_id: stateUpdateId })
      // We filter out the multi transactions because we show the child transactions instead
      .andWhereNot({ type: 'MultiTransaction' })
      .orderBy('id', 'desc')
      .offset(offset)
      .limit(limit)

    return rows.map(toRecord)
  }

  async findById(
    id: number,
    trx?: Knex.Transaction
  ): Promise<Record | undefined> {
    const knex = await this.knex(trx)
    const row = await knex('l2_transactions').where({ id }).first()

    return row ? toRecord(row) : undefined
  }

  async findByTransactionId(id: number): Promise<AggregatedRecord | undefined> {
    const knex = await this.knex()
    const originalTransaction = await knex('l2_transactions')
      .where({ transaction_id: id, parent_id: null })
      .orderBy('id', 'asc')
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

  async findLatestStateUpdateId(
    trx?: Knex.Transaction
  ): Promise<number | undefined> {
    const knex = await this.knex(trx)
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
    data: decodeL2TransactionData(row.data),
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
    originalTransaction: decodeL2TransactionData(transaction.data),
    alternativeTransactions: alternatives.map((alternative) =>
      decodeL2TransactionData(alternative.data)
    ),
  }
}

function toPreprocessedUserL2TransactionsStatistics(
  countGroupedByType: {
    type: Exclude<PerpetualL2TransactionData['type'], 'MultiTransaction'>
    count: number
  }[],
  replacedCount: number
): PreprocessedUserL2TransactionsStatistics {
  return {
    depositCount: Number(
      countGroupedByType.find((x) => x.type === 'Deposit')?.count ?? 0
    ),
    withdrawalToAddressCount: Number(
      countGroupedByType.find((x) => x.type === 'WithdrawalToAddress')?.count ??
        0
    ),
    forcedWithdrawalCount: Number(
      countGroupedByType.find((x) => x.type === 'ForcedWithdrawal')?.count ?? 0
    ),
    tradeCount: Number(
      countGroupedByType.find((x) => x.type === 'Trade')?.count ?? 0
    ),
    forcedTradeCount: Number(
      countGroupedByType.find((x) => x.type === 'ForcedTrade')?.count ?? 0
    ),
    transferCount: Number(
      countGroupedByType.find((x) => x.type === 'Transfer')?.count ?? 0
    ),
    conditionalTransferCount: Number(
      countGroupedByType.find((x) => x.type === 'ConditionalTransfer')?.count ??
        0
    ),
    liquidateCount: Number(
      countGroupedByType.find((x) => x.type === 'Liquidate')?.count ?? 0
    ),
    deleverageCount: Number(
      countGroupedByType.find((x) => x.type === 'Deleverage')?.count ?? 0
    ),
    fundingTickCount: Number(
      countGroupedByType.find((x) => x.type === 'FundingTick')?.count ?? 0
    ),
    oraclePricesTickCount: Number(
      countGroupedByType.find((x) => x.type === 'OraclePricesTick')?.count ?? 0
    ),
    replacedTransactionsCount: replacedCount,
  }
}

function toPreprocessedL2TransactionsStatistics(
  countGroupedByType: {
    type: PerpetualL2TransactionData['type']
    count: number
  }[],
  replacedCount: number
): PreprocessedL2TransactionsStatistics {
  return {
    depositCount: Number(
      countGroupedByType.find((x) => x.type === 'Deposit')?.count ?? 0
    ),
    withdrawalToAddressCount: Number(
      countGroupedByType.find((x) => x.type === 'WithdrawalToAddress')?.count ??
        0
    ),
    forcedWithdrawalCount: Number(
      countGroupedByType.find((x) => x.type === 'ForcedWithdrawal')?.count ?? 0
    ),
    tradeCount: Number(
      countGroupedByType.find((x) => x.type === 'Trade')?.count ?? 0
    ),
    forcedTradeCount: Number(
      countGroupedByType.find((x) => x.type === 'ForcedTrade')?.count ?? 0
    ),
    transferCount: Number(
      countGroupedByType.find((x) => x.type === 'Transfer')?.count ?? 0
    ),
    conditionalTransferCount: Number(
      countGroupedByType.find((x) => x.type === 'ConditionalTransfer')?.count ??
        0
    ),
    liquidateCount: Number(
      countGroupedByType.find((x) => x.type === 'Liquidate')?.count ?? 0
    ),
    deleverageCount: Number(
      countGroupedByType.find((x) => x.type === 'Deleverage')?.count ?? 0
    ),
    fundingTickCount: Number(
      countGroupedByType.find((x) => x.type === 'FundingTick')?.count ?? 0
    ),
    oraclePricesTickCount: Number(
      countGroupedByType.find((x) => x.type === 'OraclePricesTick')?.count ?? 0
    ),
    multiTransactionCount: Number(
      countGroupedByType.find((x) => x.type === 'MultiTransaction')?.count ?? 0
    ),
    replacedTransactionsCount: replacedCount,
  }
}
