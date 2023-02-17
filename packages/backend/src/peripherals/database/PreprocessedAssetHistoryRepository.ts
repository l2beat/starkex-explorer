import { AssetHash, AssetId, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { PreprocessedAssetHistoryRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface PreprocessedAssetHistoryRecord {
  historyId: number
  stateUpdateId: number
  blockNumber: number
  timestamp: Timestamp
  starkKey: StarkKey
  positionOrVaultId: bigint
  assetHashOrId: AssetHash | AssetId
  balance: bigint
  prevBalance: bigint
  price?: bigint
  prevPrice?: bigint
  isCurrent: boolean
  prevHistoryId?: number
}

export class PreprocessedAssetHistoryRepository<
  T extends AssetHash | AssetId
> extends BaseRepository {
  private toAssetType: (value: string) => T

  constructor(
    database: Database,
    toAssetType: (value: string) => T,
    logger: Logger
  ) {
    super(database, logger)
    this.toAssetType = toAssetType

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.addMany = this.wrapAddMany(this.addMany)
    this.findByHistoryId = this.wrapFind(this.findByHistoryId)
    this.deleteByHistoryId = this.wrapDelete(this.deleteByHistoryId)
    this.getCurrentByStarkKeyAndAssets = this.wrapGet(
      this.getCurrentByStarkKeyAndAssets
    )
    this.getCurrentByStarkKey = this.wrapGet(this.getCurrentByStarkKey)
    this.getCurrentByPositionOrVaultId = this.wrapGet(
      this.getCurrentByPositionOrVaultId
    )
    this.setAsCurrentByHistoryId = this.wrapUpdate(this.setAsCurrentByHistoryId)
    this.unsetCurrentByStarkKeyAndAsset = this.wrapUpdate(
      this.unsetCurrentByStarkKeyAndAsset
    )
    this.getPrevHistoryByStateUpdateId = this.wrapGet(
      this.getPrevHistoryByStateUpdateId
    )
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(
    record: Omit<PreprocessedAssetHistoryRecord, 'historyId'>,
    trx: Knex.Transaction
  ): Promise<number> {
    const knex = await this.knex(trx)
    const results = await knex('preprocessed_asset_history')
      .insert(toPreprocessedAssetHistoryRow(record))
      .returning('id')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return results[0]!.id
  }

  async addMany(
    rows: Omit<PreprocessedAssetHistoryRow, 'id'>[],
    trx: Knex.Transaction
  ) {
    throw new Error(
      "This method doesn't respect transaction! Don't use until reviewed!"
    )
    const knex = await this.knex(trx)
    const ids = await knex('preprocessed_asset_history')
      .insert(rows)
      .returning('id')
    return ids.map((x) => x.id)
  }

  async findByHistoryId(
    id: number,
    trx: Knex.Transaction
  ): Promise<PreprocessedAssetHistoryRecord | undefined> {
    const knex = await this.knex(trx)
    const row = await knex('preprocessed_asset_history').where('id', id).first()
    return row && toPreprocessedAssetHistoryRecord(row, this.toAssetType)
  }

  async deleteByHistoryId(historyId: number, trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_asset_history').where('id', historyId).delete()
  }

  async getCurrentByStarkKey(starkKey: StarkKey, trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history').where({
      stark_key: starkKey.toString(),
      is_current: true,
    })
    return rows.map((r) =>
      toPreprocessedAssetHistoryRecord(r, this.toAssetType)
    )
  }

  async getCurrentByPositionOrVaultId(
    positionOrVaultId: bigint,
    trx: Knex.Transaction
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

  async getCurrentByStarkKeyAndAssets(
    starkKey: StarkKey,
    assets: (AssetHash | AssetId)[],
    trx: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('preprocessed_asset_history')
      .where({
        stark_key: starkKey.toString(),
        is_current: true,
      })
      .whereIn(
        'asset_hash_or_id',
        assets.map((x) => x.toString())
      )
    // Don't filter out balance === 0
    // We still need such records the get prevHistoryId

    return rows.map((r) =>
      toPreprocessedAssetHistoryRecord(r, this.toAssetType)
    )
  }

  async setAsCurrentByHistoryId(historyId: number, trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    const updates = await knex('preprocessed_asset_history')
      .update('is_current', true)
      .where('id', historyId)
    return updates
  }

  async unsetCurrentByStarkKeyAndAsset(
    starkKey: StarkKey,
    asset: AssetHash | AssetId,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const updates = await knex('preprocessed_asset_history')
      .update('is_current', false)
      .where({
        stark_key: starkKey.toString(),
        is_current: true,
        asset_hash_or_id: asset.toString(),
      })

    return updates
  }

  async getPrevHistoryByStateUpdateId(
    stateUpdateId: number,
    trx: Knex.Transaction
  ): Promise<
    Pick<PreprocessedAssetHistoryRecord, 'historyId' | 'prevHistoryId'>[]
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

  async deleteAll(trx: Knex.Transaction) {
    const knex = await this.knex(trx)
    return knex('preprocessed_asset_history').delete()
  }
}

function toPreprocessedAssetHistoryRecord<T extends AssetHash | AssetId>(
  row: PreprocessedAssetHistoryRow,
  toAssetType: (x: string) => T
): PreprocessedAssetHistoryRecord {
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
