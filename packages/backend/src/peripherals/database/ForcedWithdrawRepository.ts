import { Hash256, StarkKey, Timestamp } from '@explorer/types'
import { ForcedWithdrawTransactionRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface ForcedWithdrawTransactionRecord {
  hash: Hash256
  starkKey: StarkKey
  amount: bigint
  positionId: bigint
}

export class ForcedWithdrawRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.addSent = this.wrapAdd(this.addSent)
    // this.addMined = this.wrapXXX(this.addMined)
    // this.addReverted = this.wrapXXX(this.addReverted)
    // this.addForgotten = this.wrapXXX(this.addForgotten)
    // this.addFinalized = this.wrapXXX(this.addFinalized)
    this.findByTransactionHash = this.wrapFind(this.findByTransactionHash)
    // this.getByPositionId = this.wrapXXX(this.getByPositionId)
    // this.getByStarkKey = this.wrapXXX(this.getByStarkKey)
    // this.getByStateUpdateId = this.wrapXXX(this.getByStateUpdateId)
    // this.getNotMined = this.wrapXXX(this.getNotMined)
    // this.getMinedNotFinalized = this.wrapXXX(this.getMinedNotFinalized)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addSent(
    record: ForcedWithdrawTransactionRecord & { sentAt: Timestamp }
  ): Promise<Hash256> {
    const knex = await this.knex()
    await knex.transaction(async (trx) => {
      await trx('forced_withdraw_transactions')
        .insert(toRow(record))
        .onConflict('hash')
        .ignore()

      await trx('forced_withdraw_statuses').insert({
        hash: record.hash.toString(),
        status: 'sent',
        timestamp: BigInt(record.sentAt.toString()),
      })
    })

    return record.hash
  }

  async findByTransactionHash(
    hash: Hash256
  ): Promise<ForcedWithdrawTransactionRecord | undefined> {
    const knex = await this.knex()
    const row = await knex('forced_withdraw_transactions')
      .where('hash', hash.toString())
      .first()
    if (!row) {
      return undefined
    }
    return toRecord(row)
  }

  async deleteAll() {
    const knex = await this.knex()
    const countA = await knex('forced_withdraw_transactions').delete()
    const countB = await knex('forced_withdraw_statuses').delete()
    return countA + countB
  }

  async deleteAfter(blockNumber: number) {
    const knex = await this.knex()
    return await knex('forced_withdraw_statuses')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

function toRecord(
  row: ForcedWithdrawTransactionRow
): ForcedWithdrawTransactionRecord {
  return {
    hash: Hash256(row.hash),
    starkKey: StarkKey(row.stark_key),
    amount: row.amount,
    positionId: row.position_id,
  }
}

function toRow(
  row: ForcedWithdrawTransactionRecord
): ForcedWithdrawTransactionRow {
  return {
    hash: row.hash.toString(),
    stark_key: row.starkKey.toString(),
    amount: row.amount,
    position_id: row.positionId,
  }
}
