import { AssetId, StarkKey } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedAssetHistoryRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PreprocessedAssetHistoryRecord {
  historyId: number
  stateUpdateId: number
  blockNumber: number
  timestamp: bigint
  starkKey: StarkKey
  positionOrVaultId: bigint
  token: AssetId
  tokenIsPerp: boolean
  balance: bigint
  prevBalance: bigint
  price?: bigint
  prevPrice?: bigint
  isCurrent: boolean
  prevHistoryId?: number
}

export class PreprocessedAssetHistoryRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.addMany = this.wrapAddMany(this.addMany)
    this.deleteByHistoryId = this.wrapDelete(this.deleteByHistoryId)
    this.getCurrentByStarkKeyAndTokenIds = this.wrapGet(
      this.getCurrentByStarkKeyAndTokenIds
    )
    this.getCurrentNonEmptyByStarkKey = this.wrapGet(
      this.getCurrentNonEmptyByStarkKey
    )
    this.getCurrentNonEmptyByPositionOrVaultId = this.wrapGet(
      this.getCurrentNonEmptyByPositionOrVaultId
    )
    this.setCurrentByHistoryId = this.wrapUpdate(this.setCurrentByHistoryId)
    this.unsetCurrentByStarkKeyAndTokenId = this.wrapUpdate(
      this.unsetCurrentByStarkKeyAndTokenId
    )
    // this.unsetCurrentByStarkKeyAndTokenIds = this.wrapUpdate(
    //   this.unsetCurrentByStarkKeyAndTokenIds
    // )
    this.getPrevHistoryIdOfCurrentWithStateUpdateId = this.wrapGet(
      this.getPrevHistoryIdOfCurrentWithStateUpdateId
    )

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(
    row: Omit<PreprocessedAssetHistoryRecord, 'historyId'>,
    trx?: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    await knex('preprocessed_asset_history').insert(
      toPreprocessedAssetHistoryRow(row)
    )
    return row.stateUpdateId
  }

  async addMany(
    rows: Omit<PreprocessedAssetHistoryRow, 'id'>[],
    trx?: Knex.Transaction
  ) {
    throw new Error(
      "This method doesn't respect trascation! Don't use until reviewed!"
    )
    const knex = await this.knex(trx)
    const ids = await knex('preprocessed_asset_history')
      .insert(rows)
      .returning('id')
    return ids.map((x) => x.id)
  }

  async deleteByHistoryId(historyId: number, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_asset_history').where('id', historyId).delete()
  }

  async getCurrentNonEmptyByStarkKey(
    starkKey: StarkKey,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where({
        stark_key: starkKey.toString(),
        is_current: true,
      })
      .andWhere('balance', '!=', 0)
    return rows.map(toPreprocessedAssetHistoryRecord)
  }

  async getCurrentNonEmptyByPositionOrVaultId(
    positionOrVaultId: bigint,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where({
        position_or_vault_id: positionOrVaultId,
        is_current: true,
      })
      .andWhere('balance', '!=', 0)
    return rows.map(toPreprocessedAssetHistoryRecord)
  }

  async getCurrentByStarkKeyAndTokenIds(
    starkKey: StarkKey,
    tokenIds: AssetId[],
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where({
        stark_key: starkKey.toString(),
        is_current: true,
      })
      .whereIn(
        'token',
        tokenIds.map((x) => x.toString())
      )
      .andWhere('balance', '!=', 0)

    return rows.map(toPreprocessedAssetHistoryRecord)
  }

  async setCurrentByHistoryId(historyId: number, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const updates = await knex('preprocessed_asset_history')
      .update('is_current', true)
      .where('id', historyId)
    return updates
  }

  async unsetCurrentByStarkKeyAndTokenId(
    starkKey: StarkKey,
    tokenId: AssetId,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const updates = await knex('preprocessed_asset_history')
      .update('is_current', false)
      .where({
        stark_key: starkKey.toString(),
        is_current: true,
        token: tokenId.toString(),
      })

    return updates
  }

  // async unsetCurrentByStarkKeyAndTokenIds(
  //   starkKey: StarkKey,
  //   tokenIds: AssetId[],
  //   trx?: Knex.Transaction
  // ) {
  //   const knex = await this.knex(trx)
  //   const updates = await knex('preprocessed_asset_history')
  //     .update('is_current', false)
  //     .where({
  //       stark_key: starkKey.toString(),
  //       is_current: true,
  //     })
  //     .whereIn('token', tokenIds)

  //   return updates
  // }

  async getPrevHistoryIdOfCurrentWithStateUpdateId(
    stateUpdateId: number,
    trx?: Knex.Transaction
  ): Promise<
    Pick<PreprocessedAssetHistoryRecord, 'historyId' | 'prevHistoryId'>[]
  > {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .select('id', 'prev_history_id')
      .where({
        state_update_id: stateUpdateId,
        is_current: true,
      })

    return rows.map((row) => ({
      historyId: row.id,
      prevHistoryId: row.prev_history_id ?? undefined,
    }))
  }
}

function toPreprocessedAssetHistoryRecord(
  row: PreprocessedAssetHistoryRow
): PreprocessedAssetHistoryRecord {
  return {
    historyId: row.id,
    stateUpdateId: row.state_update_id,
    blockNumber: row.block_number,
    timestamp: BigInt(row.timestamp),
    starkKey: StarkKey(row.stark_key),
    positionOrVaultId: row.position_or_vault_id,
    token: AssetId(row.token),
    tokenIsPerp: row.token_is_perp,
    balance: row.balance,
    prevBalance: row.prev_balance,
    price: row.price ?? undefined,
    prevPrice: row.prev_price ?? undefined,
    isCurrent: row.is_current,
    prevHistoryId: row.prev_history_id ?? undefined,
  }
}

function toPreprocessedAssetHistoryRow(
  record: Omit<PreprocessedAssetHistoryRecord, 'historyId'>
): Omit<PreprocessedAssetHistoryRow, 'id'> {
  return {
    state_update_id: record.stateUpdateId,
    block_number: record.blockNumber,
    timestamp: record.timestamp,
    stark_key: record.starkKey.toString(),
    position_or_vault_id: record.positionOrVaultId,
    token: record.token.toString(),
    token_is_perp: record.tokenIsPerp,
    balance: record.balance,
    prev_balance: record.prevBalance,
    price: record.price ?? null,
    prev_price: record.prevPrice ?? null,
    is_current: record.isCurrent,
    prev_history_id: record.prevHistoryId ?? null,
  }
}
