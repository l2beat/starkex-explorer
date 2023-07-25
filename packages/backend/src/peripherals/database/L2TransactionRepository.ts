import {
  PerpetualL2MultiTransactionData,
  PerpetualL2TransactionData,
} from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import { Logger } from '@l2beat/backend-tools'
import { Knex } from 'knex'
import { L2TransactionRow } from 'knex/types/tables'
import uniq from 'lodash/uniq'

import { L2TransactionTypesToExclude } from '../../config/starkex/StarkexConfig'
import { PaginationOptions } from '../../model/PaginationOptions'
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
  stateUpdateId: number | undefined
  blockNumber: number | undefined
  parentId: number | undefined
  state: 'alternative' | 'replaced' | undefined
  starkKeyA: StarkKey | undefined
  starkKeyB: StarkKey | undefined
  data: Extract<PerpetualL2TransactionData, { type: T }>
}

interface AggregatedRecord {
  id: number
  transactionId: number
  stateUpdateId: number | undefined
  blockNumber: number | undefined
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
    this.addFeederGatewayTransaction = this.wrapAdd(
      this.addFeederGatewayTransaction
    )
    this.addLiveTransaction = this.wrapAdd(this.addLiveTransaction)
    this.addMultiTransaction = this.wrapAdd(this.addMultiTransaction)
    this.addSingleTransaction = this.wrapAdd(this.addSingleTransaction)
    this.addTransaction = this.wrapAdd(this.addTransaction)
    this.getStarkKeysByStateUpdateId = this.wrapGet(
      this.getStarkKeysByStateUpdateId
    )
    this.getStatisticsByStateUpdateId = this.wrapAny(
      this.getStatisticsByStateUpdateId
    )
    this.getStatisticsByStateUpdateIdAndStarkKey = this.wrapAny(
      this.getStatisticsByStateUpdateIdAndStarkKey
    )
    this.getPaginatedWithoutMulti = this.wrapGet(this.getPaginatedWithoutMulti)
    this.getPaginatedWithoutMultiByStateUpdateId = this.wrapGet(
      this.getPaginatedWithoutMultiByStateUpdateId
    )
    this.getUserSpecificPaginated = this.wrapGet(this.getUserSpecificPaginated)
    this.findById = this.wrapFind(this.findById)
    this.findByTransactionId = this.wrapFind(this.findByTransactionId)
    this.findAggregatedByTransactionId = this.wrapFind(
      this.findAggregatedByTransactionId
    )
    this.findLatestStateUpdateId = this.wrapFind(this.findLatestStateUpdateId)
    this.findOldestByTransactionId = this.wrapFind(
      this.findOldestByTransactionId
    )
    this.findLatestIncluded = this.wrapFind(this.findLatestIncluded)
    this.deleteAfterBlock = this.wrapDelete(this.deleteAfterBlock)
    this.deleteByTransactionIds = this.wrapDelete(this.deleteByTransactionIds)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.runInTransactionWithLockedTable = this.wrapAny(
      this.runInTransactionWithLockedTable
    )
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addFeederGatewayTransaction(
    record: {
      transactionId: number
      data: PerpetualL2TransactionData
      stateUpdateId: number
      blockNumber: number
      state: 'replaced' | 'alternative' | undefined
    },
    trx?: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)

    const existing = await this.findByTransactionId(record.transactionId, trx)

    if (record.state === 'alternative' && !existing) {
      throw new Error('L2 Transaction does not exist when adding alternative')
    }

    if (record.state === 'alternative' && existing?.state !== 'replaced') {
      throw new Error(
        'L2 Transaction should be "replaced" when adding alternative'
      )
    }

    if (record.state !== 'alternative') {
      if (existing) {
        throw new Error(
          'L2 Transaction already exists when adding from Feeder Gatway'
        )
      }
    }

    return await this.addTransaction({ ...record, state: record.state }, knex)
  }

  async addLiveTransaction(
    record: {
      transactionId: number
      data: PerpetualL2TransactionData
    },
    trx?: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)

    const existingRecord = await this.findOldestByTransactionId(
      record.transactionId
    )

    const isAlternative = !!existingRecord

    if (existingRecord) {
      /*
        If live transactions are somehow behind the transactions from feeder gateway, we should not add them
        Although we should add them if transaction in database is not included as it is alternative to the one in database
      */
      if (
        existingRecord.transactionId === record.transactionId &&
        existingRecord.stateUpdateId !== undefined
      ) {
        return 0
      }

      if (existingRecord.state === undefined) {
        await knex('l2_transactions')
          .update({ state: 'replaced' })
          .where({ transaction_id: record.transactionId })
      }
    }

    return await this.addTransaction(
      {
        ...record,
        state: isAlternative ? 'alternative' : undefined,
      },
      knex
    )
  }

  private async addTransaction(
    record: {
      transactionId: number
      data: PerpetualL2TransactionData
      parentId?: number
      stateUpdateId?: number
      blockNumber?: number
      state: 'replaced' | 'alternative' | undefined
    },
    knex: Knex
  ) {
    if (record.data.type === 'MultiTransaction') {
      return await this.addMultiTransaction(
        {
          ...record,
          data: record.data,
          state: record.state,
        },
        knex
      )
    } else {
      return await this.addSingleTransaction(
        {
          ...record,
          data: record.data,
          state: record.state,
        },
        knex
      )
    }
  }

  private async addSingleTransaction(
    record: {
      transactionId: number
      data: Exclude<PerpetualL2TransactionData, PerpetualL2MultiTransactionData>
      parentId?: number
      stateUpdateId?: number
      blockNumber?: number
      state: 'replaced' | 'alternative' | undefined
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
        state: record.state ?? null,
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
      data: PerpetualL2MultiTransactionData
      stateUpdateId?: number
      blockNumber?: number
      state: 'replaced' | 'alternative' | undefined
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
        state: record.state ?? null,
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
          data: transaction,
          parentId,
          state: record.state,
        },
        knex
      )
    }
    return parentId
  }

  async getStarkKeysByStateUpdateId(
    stateUpdateId: number,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const starkKeyARows = (await knex('l2_transactions')
      .distinct('stark_key_a')
      .whereNotNull('stark_key_a')
      .andWhere({ state_update_id: stateUpdateId })) as {
      stark_key_a: string
    }[]

    const starkKeyBRows = (await knex('l2_transactions')
      .distinct('stark_key_b')
      .whereNotNull('stark_key_b')
      .andWhere({ state_update_id: stateUpdateId })) as {
      stark_key_b: string
    }[]

    const uniqStarkKeys = uniq([
      ...starkKeyARows.map((row) => row.stark_key_a),
      ...starkKeyBRows.map((row) => row.stark_key_b),
    ])

    return uniqStarkKeys.map((starkKey) => StarkKey(starkKey))
  }

  async getLiveStatistics(): Promise<PreprocessedL2TransactionsStatistics> {
    const knex = await this.knex()

    const countGroupedByType = (await knex('l2_transactions')
      .select('type')
      .whereNull('state_update_id')
      .count()
      .groupBy('type')) as {
      type: PerpetualL2TransactionData['type']
      count: number
    }[]

    const [replaced] = await knex('l2_transactions')
      .whereNull('state_update_id')
      .andWhere({ state: 'replaced' })
      .count()

    return toPreprocessedL2TransactionsStatistics(
      countGroupedByType,
      Number(replaced?.count ?? 0)
    )
  }

  async getLiveStatisticsByStarkKey(
    starkKey: StarkKey
  ): Promise<PreprocessedUserL2TransactionsStatistics> {
    const knex = await this.knex()

    const countGroupedByType = (await knex('l2_transactions')
      .select('type')
      .whereNull('state_update_id')
      //eslint-disable-next-line @typescript-eslint/no-misused-promises
      .andWhere((qB) =>
        qB
          .where({ stark_key_a: starkKey.toString() })
          .orWhere({ stark_key_b: starkKey.toString() })
      )
      .count()
      .groupBy('type')) as {
      type: Exclude<PerpetualL2TransactionData['type'], 'MultiTransaction'>
      count: number
    }[]

    const [replaced] = await knex('l2_transactions')
      .whereNull('state_update_id')
      .andWhere({ state: 'replaced' })
      //eslint-disable-next-line @typescript-eslint/no-misused-promises
      .andWhere((qB) =>
        qB
          .where({ stark_key_a: starkKey.toString() })
          .orWhere({ stark_key_b: starkKey.toString() })
      )
      .count()

    return toPreprocessedUserL2TransactionsStatistics(
      countGroupedByType,
      Number(replaced?.count ?? 0)
    )
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

  async getPaginatedWithoutMulti(
    { offset, limit }: PaginationOptions,
    excludeL2TransactionTypes: L2TransactionTypesToExclude = []
  ) {
    const knex = await this.knex()
    const rows = await knex('l2_transactions')
      .whereNotIn('type', excludeL2TransactionTypes)
      // We filter out the multi transactions because we show the child transactions instead
      .andWhereNot({ type: 'MultiTransaction' })
      .orderBy('state_update_id', 'desc')
      .orderBy('id', 'desc')
      .offset(offset)
      .limit(limit)

    return rows.map(toRecord)
  }

  async getUserSpecificPaginated(
    starkKey: StarkKey,
    { offset, limit }: PaginationOptions,
    excludeL2TransactionTypes: L2TransactionTypesToExclude = []
  ) {
    const knex = await this.knex()
    // We do not need to filter multi transactions because they are not user specific
    const rows = await knex('l2_transactions')
      .whereNotIn('type', excludeL2TransactionTypes)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .andWhere((qB) =>
        qB
          .where({
            stark_key_a: starkKey.toString(),
          })
          .orWhere({
            stark_key_b: starkKey.toString(),
          })
      )
      .orderBy('state_update_id', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset)
    return rows.map(toRecord)
  }

  async getPaginatedWithoutMultiByStateUpdateId(
    stateUpdateId: number,
    { offset, limit }: PaginationOptions,
    excludeL2TransactionTypes: L2TransactionTypesToExclude = []
  ) {
    const knex = await this.knex()
    const rows = await knex('l2_transactions')
      .whereNotIn('type', excludeL2TransactionTypes)
      .andWhere({ state_update_id: stateUpdateId })
      // We filter out the multi transactions because we show the child transactions instead
      .andWhereNot({ type: 'MultiTransaction' })
      .orderBy('state_update_id', 'desc')
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

  async findByTransactionId(
    transactionId: number,
    trx?: Knex.Transaction
  ): Promise<Record | undefined> {
    const knex = await this.knex(trx)
    const row = await knex('l2_transactions')
      .where({ transaction_id: transactionId })
      .first()

    return row ? toRecord(row) : undefined
  }

  async findAggregatedByTransactionId(
    id: number
  ): Promise<AggregatedRecord | undefined> {
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

  async findOldestByTransactionId(id: number): Promise<Record | undefined> {
    const knex = await this.knex()
    const row = await knex('l2_transactions')
      .where({ transaction_id: id })
      .orderBy('id', 'asc')
      .first()

    return row ? toRecord(row) : undefined
  }

  async findLatestStateUpdateId(
    trx?: Knex.Transaction
  ): Promise<number | undefined> {
    const knex = await this.knex(trx)
    const results = await knex('l2_transactions')
      .select('state_update_id')
      .whereNotNull('state_update_id')
      .orderBy('state_update_id', 'desc')
      .limit(1)
      .first()
    return results?.state_update_id ? results.state_update_id : undefined
  }

  async findLatestIncluded(): Promise<Record | undefined> {
    const knex = await this.knex()
    const row = await knex('l2_transactions')
      .whereNotNull('state_update_id')
      .orderBy('transaction_id', 'desc')
      .limit(1)
      .first()

    return row ? toRecord(row) : undefined
  }

  async deleteAfterBlock(blockNumber: number) {
    const knex = await this.knex()
    return knex('l2_transactions')
      .where('block_number', '>', blockNumber)
      .delete()
  }

  async deleteByTransactionIds(
    transactionIds: number[],
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    return knex('l2_transactions')
      .whereIn('transaction_id', transactionIds)
      .delete()
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('l2_transactions').delete()
  }

  async runInTransactionWithLockedTable(
    fn: (trx: Knex.Transaction) => Promise<void>
  ) {
    await this.runInTransaction(async (trx) => {
      await this.lockTable(trx)
      await fn(trx)
    })
  }

  async lockTable(trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    await knex.raw('LOCK TABLE l2_transactions IN ROW EXCLUSIVE MODE;')
  }
}

function toRecord(row: L2TransactionRow): Record {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    stateUpdateId: row.state_update_id ? row.state_update_id : undefined,
    blockNumber: row.block_number ? row.block_number : undefined,
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
    stateUpdateId: transaction.state_update_id
      ? transaction.state_update_id
      : undefined,
    blockNumber: transaction.block_number
      ? transaction.block_number
      : undefined,
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
