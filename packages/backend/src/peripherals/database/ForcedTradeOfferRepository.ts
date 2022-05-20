import { AssetId, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { ForcedTradeOfferRow as Row } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

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
  amountCollateral: bigint
  amountSynthetic: bigint
  aIsBuyingSynthetic: boolean
  accepted?: Accepted
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
    amount_collateral: record.amountCollateral,
    amount_synthetic: record.amountSynthetic,
    a_is_buying_synthetic: record.aIsBuyingSynthetic,
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
    amountCollateral: row.amount_collateral,
    amountSynthetic: row.amount_synthetic,
    aIsBuyingSynthetic: row.a_is_buying_synthetic,
    accepted: undefined,
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

export class ForcedTradeOfferRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.add = this.wrapAdd(this.add)
    this.findById = this.wrapFind(this.findById)
    this.getInitial = this.wrapGet(this.getInitial)
    this.getLatestInitial = this.wrapGet(this.getLatestInitial)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.save = this.wrapSave(this.save)
  }

  async add(record: RecordCandidate): Promise<Record['id']> {
    const row = toRowCandidate(record)
    const [id] = await this.knex('forced_trade_offers')
      .insert(row)
      .returning('id')
    return id
  }

  async save(record: Record): Promise<boolean> {
    const row = toRow(record)
    const updates = await this.knex('forced_trade_offers')
      .update(row)
      .where('id', '=', row.id)
    return !!updates
  }

  async getInitial(): Promise<Record[]> {
    const rows = await this.knex('forced_trade_offers')
      .whereNull('accepted_at')
      .orderBy('created_at', 'desc')

    return rows.map(toRecord)
  }

  async getLatestInitial({
    limit,
    offset,
  }: {
    limit: number
    offset: number
  }): Promise<Record[]> {
    const rows = await this.knex('forced_trade_offers')
      .whereNull('accepted_at')
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc')

    return rows.map(toRecord)
  }

  async findById(id: Record['id']): Promise<Record | undefined> {
    const row = await this.knex('forced_trade_offers').where({ id }).first()
    return row ? toRecord(row) : undefined
  }

  async deleteAll() {
    return await this.knex('forced_trade_offers').delete()
  }
}
