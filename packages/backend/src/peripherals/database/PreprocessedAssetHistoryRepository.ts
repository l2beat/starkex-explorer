import { AssetHash, AssetId, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedAssetHistoryRow } from 'knex/types/tables'

import { PaginationOptions } from '../../model/PaginationOptions'
import { Logger } from '../../tools/Logger'
import { BaseRepository, CheckConvention } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PreprocessedAssetHistoryRecord<
  T extends AssetHash | AssetId = AssetHash | AssetId
> {
  historyId: number
  stateUpdateId: number
  blockNumber: number
  timestamp: Timestamp
  starkKey: StarkKey
  positionOrVaultId: bigint
  assetHashOrId: T
  balance: bigint
  prevBalance: bigint
  price?: bigint
  prevPrice?: bigint
  isCurrent: boolean
  prevHistoryId?: number
}

export class PreprocessedAssetHistoryRepository<
  T extends AssetHash | AssetId = AssetHash | AssetId
> extends BaseRepository {
  private toAssetType: (value: string) => T

  constructor(
    database: Database,
    toAssetType: (value: string) => T,
    logger: Logger
  ) {
    super(database, logger)
    this.toAssetType = toAssetType

    this.autoWrap<CheckConvention<PreprocessedAssetHistoryRepository>>(this)
  }

  async add(
    record: Omit<PreprocessedAssetHistoryRecord<T>, 'historyId'>,
    trx: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    const results = await knex('preprocessed_asset_history')
      .insert(toPreprocessedAssetHistoryRow(record))
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async findByHistoryId(
    id: number,
    trx: Knex.Transaction
  ): Promise<PreprocessedAssetHistoryRecord<T> | undefined> {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_asset_history').where('id', id).first()
    return row && toPreprocessedAssetHistoryRecord(row, this.toAssetType)
  }

  async getByStateUpdateIdPaginated(
    stateUpdateId: number,
    { offset, limit }: PaginationOptions,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where('state_update_id', stateUpdateId)
      .orderBy('id')
      .offset(offset)
      .limit(limit)

    return rows.map((r) =>
      toPreprocessedAssetHistoryRecord(r, this.toAssetType)
    )
  }

  async countByStateUpdateId(stateUpdateId: number, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const [result] = await knex('preprocessed_asset_history')
      .where('state_update_id', stateUpdateId)
      .count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count!)
  }

  async deleteByHistoryId(historyId: number, trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_asset_history').where('id', historyId).delete()
  }

  async getCurrentByStarkKey(starkKey: StarkKey, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history').where({
      stark_key: starkKey.toString(),
      is_current: true,
    })
    return rows.map((r) =>
      toPreprocessedAssetHistoryRecord(r, this.toAssetType)
    )
  }

  async countOfCurrentByStarkKey(starkKey: StarkKey, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const [result] = await knex('preprocessed_asset_history')
      .where({
        stark_key: starkKey.toString(),
        is_current: true,
      })
      .count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count!)
  }

  async getCurrentByStarkKeyPaginated(
    starkKey: StarkKey,
    { offset, limit }: PaginationOptions,
    assetAtTop?: T,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    let query = knex('preprocessed_asset_history').where({
      stark_key: starkKey.toString(),
      is_current: true,
    })
    if (assetAtTop) {
      // Make sure that assetIdAtTop (normally the collateral asset)
      // is always the first one in the list, regardless of sorting
      query = query.orderByRaw(
        // DO NOT order by position_or_vault_id - it's not indexed
        // and confuses the query planner and it runs 60 seconds for some users
        'CASE WHEN asset_hash_or_id = ? THEN 0 ELSE 1 END, asset_hash_or_id',
        assetAtTop.toString()
      )
    }

    const rows = await query.offset(offset).limit(limit)
    return rows.map((r) =>
      toPreprocessedAssetHistoryRecord(r, this.toAssetType)
    )
  }

  async countByStateUpdateIdGroupedByStarkKey(
    stateUpdateId: number,
    trx?: Knex.Transaction
  ): Promise<{ starkKey: StarkKey; count: number }[]> {
    const knex = await this.knex(trx)
    const rows: { starkKey: StarkKey; count: bigint }[] = await knex(
      'preprocessed_asset_history'
    )
      .select('stark_key as starkKey')
      .count('* as count')
      .where('state_update_id', stateUpdateId)
      .groupBy('stark_key')
    return rows.map((r) => ({ starkKey: r.starkKey, count: Number(r.count) }))
  }

  async countOfNewAssetsByStateUpdateIdGroupedByStarkKey(
    stateUpdateId: number,
    trx?: Knex.Transaction
  ): Promise<{ starkKey: StarkKey; count: number }[]> {
    const knex = await this.knex(trx)
    const rows: { starkKey: StarkKey; count: bigint }[] = await knex(
      'preprocessed_asset_history'
    )
      .select('stark_key as starkKey')
      .count('* as count')
      .where('state_update_id', stateUpdateId)
      .where('prev_balance', 0)
      .where('balance', '<>', 0)
      .groupBy('stark_key')
    return rows.map((r) => ({ starkKey: r.starkKey, count: Number(r.count) }))
  }

  async countOfRemovedAssetsByStateUpdateIdGroupedByStarkKey(
    stateUpdateId: number,
    trx?: Knex.Transaction
  ): Promise<{ starkKey: StarkKey; count: number }[]> {
    const knex = await this.knex(trx)
    const rows: { starkKey: StarkKey; count: bigint }[] = await knex(
      'preprocessed_asset_history'
    )
      .select('stark_key as starkKey')
      .count('* as count')
      .where('state_update_id', stateUpdateId)
      .where('prev_balance', '<>', 0)
      .where('balance', 0)
      .groupBy('stark_key')
    return rows.map((r) => ({ starkKey: r.starkKey, count: Number(r.count) }))
  }

  async countByStarkKey(starkKey: StarkKey, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const [result] = await knex('preprocessed_asset_history')
      .where('stark_key', starkKey.toString())
      .count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count!)
  }

  async getByStarkKeyPaginated(
    starkKey: StarkKey,
    { offset, limit }: PaginationOptions,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where('stark_key', starkKey.toString())
      .orderBy('timestamp', 'desc')
      .offset(offset)
      .limit(limit)
    return rows.map((r) =>
      toPreprocessedAssetHistoryRecord(r, this.toAssetType)
    )
  }

  async getCurrentByPositionOrVaultId(
    positionOrVaultId: bigint,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history').where({
      position_or_vault_id: positionOrVaultId,
      is_current: true,
    })
    return rows.map((r) =>
      toPreprocessedAssetHistoryRecord(r, this.toAssetType)
    )
  }

  async findCurrentByStarkKeyAndAsset(
    starkKey: StarkKey,
    asset: AssetHash | AssetId,
    trx: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_asset_history')
      .where({
        stark_key: starkKey.toString(),
        asset_hash_or_id: asset.toString(),
        is_current: true,
      })
      .first()

    return row && toPreprocessedAssetHistoryRecord(row, this.toAssetType)
  }

  async updateAsCurrentByHistoryId(
    { historyId, isCurrent }: { historyId: number; isCurrent: boolean },
    trx: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const updates = await knex('preprocessed_asset_history')
      .update('is_current', isCurrent)
      .where('id', historyId)
    return updates
  }

  async updateCurrentByPositionOrVaultIdAndAsset(
    {
      isCurrent,
      positionOrVaultId,
      asset,
    }: {
      isCurrent: boolean
      positionOrVaultId: bigint
      asset: AssetHash | AssetId
    },
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const updates = await knex('preprocessed_asset_history')
      .update('is_current', isCurrent)
      .where({
        position_or_vault_id: positionOrVaultId,
        is_current: true,
        asset_hash_or_id: asset.toString(),
      })

    return updates
  }

  async getPrevHistoryByStateUpdateId(
    stateUpdateId: number,
    trx: Knex.Transaction
  ): Promise<
    Pick<PreprocessedAssetHistoryRecord<T>, 'historyId' | 'prevHistoryId'>[]
  > {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .select('id', 'prev_history_id')
      .where('state_update_id', stateUpdateId)

    return rows.map((row) => ({
      historyId: row.id,
      prevHistoryId: row.prev_history_id ?? undefined,
    }))
  }

  async starkKeyExists(starkKey: StarkKey, trx?: Knex.Transaction) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where('stark_key', starkKey.toString())
      .count()

    return rows.length > 0
  }

  async deleteAll(trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_asset_history').delete()
  }
}

function toPreprocessedAssetHistoryRecord<T extends AssetHash | AssetId>(
  row: PreprocessedAssetHistoryRow,
  toAssetType: (x: string) => T
): PreprocessedAssetHistoryRecord<T> {
  return {
    historyId: row.id,
    stateUpdateId: row.state_update_id,
    blockNumber: row.block_number,
    timestamp: Timestamp(row.timestamp),
    starkKey: StarkKey(row.stark_key),
    positionOrVaultId: row.position_or_vault_id,
    assetHashOrId: toAssetType(row.asset_hash_or_id),
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
    timestamp: BigInt(record.timestamp.toString()),
    stark_key: record.starkKey.toString(),
    position_or_vault_id: record.positionOrVaultId,
    asset_hash_or_id: record.assetHashOrId.toString(),
    balance: record.balance,
    prev_balance: record.prevBalance,
    price: record.price ?? null,
    prev_price: record.prevPrice ?? null,
    is_current: record.isCurrent,
    prev_history_id: record.prevHistoryId ?? null,
  }
}
