import { Hash256, Timestamp } from '@explorer/types'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'
import {
  encodeWithdrawableBalanceChangeData,
  WithdrawableBalanceChangeData,
} from './WithdrawableBalanceChange'

export class WithdrawableAssetRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
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
