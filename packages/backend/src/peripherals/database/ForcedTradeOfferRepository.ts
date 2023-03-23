import { AssetId, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { ForcedTradeOfferRow as Row } from 'knex/types/tables'

import { PaginationOptions } from '../../model/PaginationOptions'
import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface Accepted {
  at: Timestamp
  starkKeyB: StarkKey
  positionIdB: bigint
  submissionExpirationTime: bigint // unix time in hours
  nonce: bigint
  premiumCost: boolean
  signature: string // HEX string signature of all parameters
  transactionHash?: Hash256
}

interface Record {
  id: number
  createdAt: Timestamp
  starkKeyA: StarkKey
  positionIdA: bigint
  syntheticAssetId: AssetId
  collateralAmount: bigint
  syntheticAmount: bigint
  isABuyingSynthetic: boolean
  accepted?: Accepted
  cancelledAt?: Timestamp
}
export { type Record as ForcedTradeOfferRecord }

type RecordCandidate = Omit<Record, 'id'> & { id?: Record['id'] }
type RowCandidate = Omit<Row, 'id'> & { id?: Row['id'] }

function toRowCandidate(record: RecordCandidate): RowCandidate {
  const orNull = <T>(value?: T) => (value !== undefined ? value : null)
  return {
    id: record.id,
    created_at: BigInt(record.createdAt.toString()),
    stark_key_a: record.starkKeyA.toString(),
    position_id_a: record.positionIdA,
    synthetic_asset_id: record.syntheticAssetId.toString(),
    collateral_amount: record.collateralAmount,
    synthetic_amount: record.syntheticAmount,
    is_a_buying_synthetic: record.isABuyingSynthetic,
    accepted_at: record.accepted?.at
      ? BigInt(record.accepted.at.toString())
      : null,
    stark_key_b: orNull(record.accepted?.starkKeyB.toString()),
    position_id_b: orNull(record.accepted?.positionIdB),
    submission_expiration_time: orNull(
      record.accepted?.submissionExpirationTime
    ),
    nonce: orNull(record.accepted?.nonce),
    premium_cost: orNull(record.accepted?.premiumCost),
    signature: orNull(record.accepted?.signature),
    transaction_hash: orNull(record.accepted?.transactionHash?.toString()),
    cancelled_at:
      record.cancelledAt !== undefined
        ? BigInt(record.cancelledAt.toString())
        : null,
  }
}

function toRow(record: Record): Row {
  return {
    ...toRowCandidate(record),
    id: record.id,
  }
}

function toRecord(row: Row): Record {
  const record = {
    id: row.id,
    createdAt: Timestamp(row.created_at),
    starkKeyA: StarkKey(row.stark_key_a),
    positionIdA: row.position_id_a,
    syntheticAssetId: AssetId(row.synthetic_asset_id),
    collateralAmount: row.collateral_amount,
    syntheticAmount: row.synthetic_amount,
    isABuyingSynthetic: row.is_a_buying_synthetic,
    accepted: undefined,
    cancelledAt: row.cancelled_at ? Timestamp(row.cancelled_at) : undefined,
  }
  if (
    row.accepted_at !== null &&
    row.stark_key_b !== null &&
    row.position_id_b !== null &&
    row.submission_expiration_time !== null &&
    row.nonce !== null &&
    row.premium_cost !== null &&
    row.signature !== null
  ) {
    return {
      ...record,
      accepted: {
        at: Timestamp(row.accepted_at),
        nonce: row.nonce,
        positionIdB: row.position_id_b,
        premiumCost: row.premium_cost,
        signature: row.signature,
        starkKeyB: StarkKey(row.stark_key_b),
        submissionExpirationTime: row.submission_expiration_time,
        transactionHash: row.transaction_hash
          ? Hash256(row.transaction_hash)
          : undefined,
      },
    }
  } else {
    return record
  }
}

interface InitialFilters {
  type?: 'buy' | 'sell'
  assetId?: AssetId
}

export class ForcedTradeOfferRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */
    this.add = this.wrapAdd(this.add)
    this.update = this.wrapUpdate(this.update)
    this.updateTransactionHash = this.wrapUpdate(this.updateTransactionHash)
    this.findById = this.wrapFind(this.findById)
    this.getInitial = this.wrapGet(this.getInitial)
    this.getByPositionId = this.wrapGet(this.getByPositionId)
    this.getUserOffersByStarkKey = this.wrapGet(this.getUserOffersByStarkKey)
    this.getInitialAssetIds = this.wrapGet(this.getInitialAssetIds)
    this.getPaginated = this.wrapGet(this.getPaginated)
    this.getAvailablePaginated = this.wrapGet(this.getAvailablePaginated)
    this.countAll = this.wrapAny(this.countAll)
    this.countAvailable = this.wrapAny(this.countAvailable)
    this.countInitial = this.wrapAny(this.countInitial)
    this.countByStarkKey = this.wrapAny(this.countByStarkKey)
    this.countActiveByPositionId = this.wrapAny(this.countActiveByPositionId)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add(record: RecordCandidate): Promise<Record['id']> {
    const row = toRowCandidate(record)
    const knex = await this.knex()
    const [result] = (await knex('forced_trade_offers')
      .insert(row)
      .returning('id')) as { id: number }[]
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return result!.id
  }

  async update(record: Record): Promise<number> {
    const row = toRow(record)
    const knex = await this.knex()
    const updates = await knex('forced_trade_offers')
      .update(row)
      .where('id', '=', row.id)
    return updates
  }

  async updateTransactionHash(
    id: number,
    transactionHash: Hash256
  ): Promise<number> {
    const knex = await this.knex()
    const updates = await knex('forced_trade_offers')
      .update({ transaction_hash: transactionHash.toString() })
      .where({ id })
    return updates
  }

  async countInitial({ assetId, type }: InitialFilters = {}): Promise<number> {
    const knex = await this.knex()
    const [result] = await this.getInitialQuery(knex, {
      assetId,
      type,
    }).count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async getInitial({
    limit,
    offset,
    assetId,
    type,
  }: {
    limit: number
    offset: number
  } & InitialFilters): Promise<Record[]> {
    const knex = await this.knex()
    const rows = await this.getInitialQuery(knex, { assetId, type })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)

    return rows.map(toRecord)
  }

  async getInitialAssetIds(): Promise<AssetId[]> {
    const knex = await this.knex()
    const rowIds = await this.getInitialQuery(knex).distinct(
      'synthetic_asset_id'
    )
    return rowIds.map((x) => x.synthetic_asset_id).map(AssetId)
  }

  async countActiveByPositionId(positionId: bigint) {
    const knex = await this.knex()
    const [result] = await this.getByPositionIdQuery(knex, positionId)
      .whereNull('cancelled_at')
      .whereNull('transaction_hash')
      .count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async getByPositionId(positionId: bigint) {
    const knex = await this.knex()
    const rows = await this.getByPositionIdQuery(knex, positionId)
    return rows.map(toRecord)
  }

  async getUserOffersByStarkKey(
    starkKey: StarkKey,
    pagination?: PaginationOptions
  ) {
    const knex = await this.knex()
    let query = knex('forced_trade_offers')
      .where({
        stark_key_a: starkKey.toString(),
      })
      .orWhere({
        stark_key_b: starkKey.toString(),
      })
      .orderBy('created_at', 'desc')
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset)
    }
    const rows = await query
    return rows.map(toRecord)
  }

  async getPaginated(options: PaginationOptions): Promise<Record[]> {
    const knex = await this.knex()
    const rows = await this.getPaginatedQuery(knex, options)

    return rows.map(toRecord)
  }

  async getAvailablePaginated(options: PaginationOptions): Promise<Record[]> {
    const knex = await this.knex()
    const query = this.getPaginatedQuery(knex, options)
    const rows = await query.whereNull('accepted_at').whereNull('cancelled_at')

    return rows.map(toRecord)
  }

  async findById(id: Record['id']): Promise<Record | undefined> {
    const knex = await this.knex()
    const row = await knex('forced_trade_offers').where({ id }).first()
    return row ? toRecord(row) : undefined
  }

  async findByHash(hash: Hash256): Promise<Record | undefined> {
    const knex = await this.knex()
    const row = await knex('forced_trade_offers')
      .where({ transaction_hash: hash.toString() })
      .first()
    return row ? toRecord(row) : undefined
  }

  async countAll() {
    const knex = await this.knex()
    const [result] = await knex('forced_trade_offers').count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async countAvailable() {
    const knex = await this.knex()
    const [result] = await knex('forced_trade_offers')
      .whereNull('accepted_at')
      .whereNull('cancelled_at')
      .count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async countByStarkKey(starkKey: StarkKey) {
    const knex = await this.knex()
    const [result] = await knex('forced_trade_offers')
      .where({ stark_key_a: starkKey.toString() })
      .count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count)
  }

  async deleteAll() {
    const knex = await this.knex()
    return await knex('forced_trade_offers').delete()
  }

  private getInitialQuery(knex: Knex, { assetId, type }: InitialFilters = {}) {
    let query = knex('forced_trade_offers')
      .whereNull('accepted_at')
      .whereNull('cancelled_at')
    if (assetId) {
      query = query.andWhere('synthetic_asset_id', '=', assetId.toString())
    }
    if (type) {
      query = query.andWhere(
        'is_a_buying_synthetic',
        '=',
        type === 'buy' ? true : false
      )
    }
    return query
  }

  private getByPositionIdQuery(knex: Knex, positionId: bigint) {
    return knex('forced_trade_offers').where(function () {
      void this.where({ position_id_a: positionId }).orWhere({
        position_id_b: positionId,
      })
    })
  }

  private getPaginatedQuery(knex: Knex, options: PaginationOptions) {
    return knex('forced_trade_offers')
      .limit(options.limit)
      .offset(options.offset)
      .orderBy('created_at', 'desc')
  }
}
