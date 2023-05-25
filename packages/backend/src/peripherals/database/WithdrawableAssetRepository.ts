import { AssetHash, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { WithdrawableAssetRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'
import { WithdrawalPerformedData } from './transactions/UserTransaction'
import {
  decodeWithdrawableBalanceChangeData,
  encodeWithdrawableBalanceChangeData,
  WithdrawalAllowedData,
} from './WithdrawalAllowed'

interface WithdrawableAssetRecord {
  id?: number
  starkKey: StarkKey
  assetHash: AssetHash
  balanceDelta: bigint
  transactionHash: Hash256
  blockNumber: number
  timestamp: Timestamp
  data: WithdrawalAllowedData | WithdrawalPerformedData
}

export type WithdrawableAssetAddRecord = Parameters<
  WithdrawableAssetRepository['add']
>['0']

export class WithdrawableAssetRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.getAssetBalancesByStarkKey = this.wrapGet(
      this.getAssetBalancesByStarkKey
    )
    this.findById = this.wrapFind(this.findById)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: {
    transactionHash: Hash256
    blockNumber: number
    timestamp: Timestamp
    data: WithdrawalAllowedData | WithdrawalPerformedData
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
        data: encoded.data,
      })
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async getAssetBalancesByStarkKey(
    starkKey: StarkKey
  ): Promise<{ assetHash: AssetHash; withdrawableBalance: bigint }[]> {
    const knex = await this.knex()
    const results: { assetHash: string; withdrawableBalance: string }[] =
      await knex('withdrawable_assets')
        .select('asset_hash as assetHash')
        .where('stark_key', starkKey.toString())
        .groupBy('asset_hash')
        .having(knex.raw('sum(balance_delta) > 0'))
        .sum('balance_delta as withdrawableBalance')
    return results.map((x) => ({
      assetHash: AssetHash(x.assetHash),
      withdrawableBalance: BigInt(x.withdrawableBalance),
    }))
  }

  async findById(id: number): Promise<WithdrawableAssetRecord | undefined> {
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
): WithdrawableAssetRecord {
  return {
    starkKey: StarkKey(row.stark_key),
    assetHash: AssetHash(row.asset_hash),
    balanceDelta: row.balance_delta,
    transactionHash: Hash256(row.transaction_hash),
    blockNumber: row.block_number,
    timestamp: Timestamp(row.timestamp),
    data: decodeWithdrawableBalanceChangeData(row.data),
  }
}
