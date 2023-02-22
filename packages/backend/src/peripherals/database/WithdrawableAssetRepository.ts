import { AssetHash, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { WithdrawableAssetRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'
import {
  decodeWithdrawableBalanceChangeData,
  encodeWithdrawableBalanceChangeData,
  WithdrawableBalanceChangeData,
} from './WithdrawableBalanceChange'

export interface WithdrawalBalanceChangeRecord {
  id?: number
  starkKey: StarkKey
  assetHash: AssetHash
  balanceDelta: bigint
  transactionHash: Hash256
  blockNumber: number
  timestamp: Timestamp
  data: WithdrawableBalanceChangeData
}

export class WithdrawableAssetRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.findById = this.wrapFind(this.findById)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: {
    transactionHash: Hash256
    blockNumber: number
    timestamp: Timestamp
    data: WithdrawableBalanceChangeData
  }): Promise<number> {
    const knex = await this.knex()
    const encoded = encodeWithdrawableBalanceChangeData(record.data)
    const results = await knex('withdrawable_assets')
      .insert({
        stark_key: encoded.starkKey.toString(),
        asset_hash: encoded.assetHash.toString(),
        balance_delta: encoded.balanceDelta,
        transaction_hash: record.transactionHash.toString(),
        timestamp: BigInt(record.timestamp.toString()),
        block_number: record.blockNumber,
        event_data: encoded.data,
      })
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async findById(
    id: number
  ): Promise<WithdrawalBalanceChangeRecord | undefined> {
    const knex = await this.knex()
    const result = await knex('withdrawable_assets').where('id', id).first()
    return result ? toWithdrawalBalanceChangeRecord(result) : undefined
  }

  async deleteAfter(blockNumber: number): Promise<number> {
    const knex = await this.knex()
    return await knex('withdrawable_assets')
      .where('block_number', '>', blockNumber)
      .delete()
  }

  async deleteAll(): Promise<number> {
    const knex = await this.knex()
    return await knex('withdrawable_assets').delete()
  }
}

function toWithdrawalBalanceChangeRecord(
  row: WithdrawableAssetRow
): WithdrawalBalanceChangeRecord {
  return {
    starkKey: StarkKey(row.stark_key),
    assetHash: AssetHash(row.asset_hash),
    balanceDelta: row.balance_delta,
    transactionHash: Hash256(row.transaction_hash),
    blockNumber: row.block_number,
    timestamp: Timestamp(row.timestamp),
    data: decodeWithdrawableBalanceChangeData(row.event_data),
  }
}
