import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'

import { Logger } from '../../tools/Logger'
import { Repository } from './types'

export interface OfferRecord {
  id: number
  createdAt: Timestamp
  starkKeyA: StarkKey
  positionIdA: bigint
  syntheticAssetId: AssetId
  amountCollateral: bigint
  amountSynthetic: bigint
  aIsBuyingSynthetic: boolean
}

export type OfferRecordCandidate = Omit<OfferRecord, 'id'>

interface OfferRow {
  id: number
  created_at: number
  stark_key_a: string
  position_id_a: bigint
  synthetic_asset_id: string
  amount_collateral: bigint
  amount_synthetic: bigint
  a_is_buying_synthetic: boolean
}

export class OfferRepository implements Repository<OfferRecord> {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async addOne(offer: OfferRecordCandidate) {
    const row = toRow(offer)
    const [id] = await this.knex('offers').insert(row).returning('id')

    this.logger.debug({ method: 'add' })

    return id
  }

  async getAll(): Promise<OfferRecord[]> {
    const rows = await this.knex('offers').select('*')
    this.logger.debug({ method: 'getAll', rows: rows.length })
    return rows.map(toRecord)
  }

  async getById(id: bigint): Promise<OfferRecord> {
    const [offer] = await this.knex('offers').where({ id })
    this.logger.debug({ method: 'getById' })
    return toRecord(offer)
  }

  async deleteAll() {
    await this.knex('offers').delete()
    this.logger.debug({ method: 'deleteAll' })
  }
}

function toRow(offer: OfferRecordCandidate): Omit<OfferRow, 'id'> {
  return {
    created_at: offer.createdAt as unknown as number,
    stark_key_a: offer.starkKeyA.toString(),
    position_id_a: offer.positionIdA,
    synthetic_asset_id: offer.syntheticAssetId.toString(),
    amount_collateral: offer.amountCollateral,
    amount_synthetic: offer.amountSynthetic,
    a_is_buying_synthetic: offer.aIsBuyingSynthetic,
  }
}

function toRecord(row: OfferRow): OfferRecord {
  return {
    id: row.id,
    createdAt: Timestamp(row.created_at),
    starkKeyA: StarkKey(row.stark_key_a),
    positionIdA: BigInt(row.position_id_a),
    syntheticAssetId: AssetId(row.synthetic_asset_id),
    amountCollateral: BigInt(row.amount_collateral),
    amountSynthetic: BigInt(row.amount_synthetic),
    aIsBuyingSynthetic: row.a_is_buying_synthetic,
  }
}
