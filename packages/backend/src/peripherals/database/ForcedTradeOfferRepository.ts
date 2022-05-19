import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export interface ForcedTradeInitialOfferRecord {
  id: number
  createdAt: Timestamp
  submittedAt?: Timestamp
  starkKeyA: StarkKey
  positionIdA: bigint
  syntheticAssetId: AssetId
  amountCollateral: bigint
  amountSynthetic: bigint
  aIsBuyingSynthetic: boolean
}

interface ForcedTradeInitialOfferRow {
  id: number
  created_at: number
  submitted_at?: number
  stark_key_a: string
  position_id_a: bigint
  synthetic_asset_id: string
  amount_collateral: bigint
  amount_synthetic: bigint
  a_is_buying_synthetic: boolean
}

export interface ForcedTradeAcceptedOfferRecord {
  acceptedAt: Timestamp
  starkKeyB: StarkKey
  positionIdB: bigint
  submissionExpirationTime: number // unix time in hours
  nonce: bigint
  premiumCost: boolean

  // https://github.com/starkware-libs/starkex-contracts/blob/StarkExchange-v3.0/scalable-dex/contracts/src/perpetual/interactions/ForcedTrades.sol#L138-L181
  signature: string // HEX string signature of all parameters
}

interface ForcedTradeAcceptedOfferRow {
  accepted_at: bigint
  stark_key_b: string
  position_id_b: bigint
  submission_expiration_time: bigint
  nonce: bigint
  premium_cost: boolean
  signature: string
}

export type ForcedTradeOfferRecord = ForcedTradeInitialOfferRecord &
  ForcedTradeAcceptedOfferRecord

type ForcedTradeOfferRow = ForcedTradeInitialOfferRow &
  ForcedTradeAcceptedOfferRow
export class ForcedTradeOfferRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.addInitialOffer = this.wrapAdd(this.addInitialOffer)
    this.addAcceptedOffer = this.wrapAdd(this.addAcceptedOffer)
    this.findOfferById = this.wrapFind(this.findOfferById)
    this.getAllInitialOffers = this.wrapGet(this.getAllInitialOffers)
    this.getAllAcceptedOffers = this.wrapGet(this.getAllAcceptedOffers)
    this.getLatest = this.wrapGet(this.getLatest)
    this.deleteAll = this.wrapDelete(this.deleteAll)
  }

  async addInitialOffer(
    offer: Omit<ForcedTradeInitialOfferRecord, 'id'>
  ): Promise<number> {
    const row = initialOfferToRow(offer)
    const [id] = await this.knex('forced_trade_offers')
      .insert(row)
      .returning('id')
    this.logger.debug({ method: 'add' })
    return id
  }

  async addAcceptedOffer({
    initialOfferId,
    acceptedOffer,
  }: {
    initialOfferId: number
    acceptedOffer: ForcedTradeAcceptedOfferRecord
  }): Promise<number> {
    const row = acceptedOfferToRow(acceptedOffer)
    await this.knex('forced_trade_offers')
      .update(row)
      .where('id', initialOfferId)
    return initialOfferId
  }

  async getAllInitialOffers(): Promise<ForcedTradeInitialOfferRecord[]> {
    const rows = await this.knex('forced_trade_offers').select('*')
    return rows.map(initialOfferToRecord)
  }

  async getAllAcceptedOffers() {
    const rows = await this.knex('forced_trade_offers')
      .whereNotNull('accepted_at')
      .select('*')

    return rows.map(acceptedOfferToRecord)
  }

  async getLatest({
    limit,
    offset,
  }: {
    limit: number
    offset: number
  }): Promise<(ForcedTradeOfferRecord | ForcedTradeInitialOfferRecord)[]> {
    const rows = await this.knex('forced_trade_offers')
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc')
    const records = rows.map((row) =>
      acceptedOfferRowTypeGuard(row)
        ? acceptedOfferToRecord(row)
        : initialOfferToRecord(row)
    )
    return records
  }

  async findOfferById(
    id: number
  ): Promise<
    ForcedTradeOfferRecord | ForcedTradeInitialOfferRecord | undefined
  > {
    const offer = await this.knex('forced_trade_offers').where({ id }).first()

    if (acceptedOfferRowTypeGuard(offer)) {
      return acceptedOfferToRecord(offer)
    }

    if (offer) {
      return initialOfferToRecord(offer)
    }

    return undefined
  }

  async getInitialOffersByStarkKey(starkKey: StarkKey) {
    const rows = await this.knex('forced_trade_offers')
      .where('stark_key_a', starkKey)
      .select('*')

    return rows.map(initialOfferToRecord)
  }

  async getAcceptedOffersByStarkKey(starkKey: StarkKey) {
    const rows = await this.knex('forced_trade_offers')
      .where('stark_key_b', starkKey)
      .select('*')

    return rows.map(acceptedOfferToRecord)
  }

  async deleteAll() {
    return await this.knex('forced_trade_offers').delete()
  }
}

function acceptedOfferRowTypeGuard(
  offerRow: ForcedTradeOfferRow | ForcedTradeInitialOfferRow | undefined
): offerRow is ForcedTradeOfferRow {
  return !!offerRow && !!(offerRow as ForcedTradeOfferRow).accepted_at
}

function acceptedOfferToRow(acceptedOffer: ForcedTradeAcceptedOfferRecord) {
  return {
    accepted_at: BigInt(acceptedOffer.acceptedAt as unknown as number),
    stark_key_b: acceptedOffer.starkKeyB.toString(),
    position_id_b: acceptedOffer.positionIdB,
    submission_expiration_time: BigInt(acceptedOffer.submissionExpirationTime),
    nonce: acceptedOffer.nonce,
    premium_cost: acceptedOffer.premiumCost,
    signature: acceptedOffer.signature,
  }
}

function acceptedOfferToRecord(
  row: ForcedTradeOfferRow
): ForcedTradeOfferRecord {
  return {
    ...initialOfferToRecord(row),
    acceptedAt: Timestamp(row.accepted_at),
    starkKeyB: StarkKey(row.stark_key_b),
    positionIdB: row.position_id_b,
    submissionExpirationTime: Number(row.submission_expiration_time),
    nonce: BigInt(row.nonce),
    premiumCost: row.premium_cost,
    signature: row.signature,
  }
}

function initialOfferToRow(
  offer: Omit<ForcedTradeInitialOfferRecord, 'id'>
): Omit<ForcedTradeInitialOfferRow, 'id'> {
  return {
    created_at: offer.createdAt as unknown as number,
    submitted_at: offer.submittedAt as unknown as number,
    stark_key_a: offer.starkKeyA.toString(),
    position_id_a: offer.positionIdA,
    synthetic_asset_id: offer.syntheticAssetId.toString(),
    amount_collateral: offer.amountCollateral,
    amount_synthetic: offer.amountSynthetic,
    a_is_buying_synthetic: offer.aIsBuyingSynthetic,
  }
}

function initialOfferToRecord(
  row: ForcedTradeInitialOfferRow
): ForcedTradeInitialOfferRecord {
  let submittedAt: Timestamp | undefined
  if (row.submitted_at) {
    submittedAt = Timestamp(row.submitted_at)
  }

  return {
    id: row.id,
    createdAt: Timestamp(row.created_at),
    submittedAt,
    starkKeyA: StarkKey(row.stark_key_a),
    positionIdA: BigInt(row.position_id_a),
    syntheticAssetId: AssetId(row.synthetic_asset_id),
    amountCollateral: BigInt(row.amount_collateral),
    amountSynthetic: BigInt(row.amount_synthetic),
    aIsBuyingSynthetic: row.a_is_buying_synthetic,
  }
}
