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
  initial_offer_id: number
  accepted_at: bigint
  stark_key_b: string
  position_id_b: bigint
  submission_expiration_time: bigint
  nonce: bigint
  premium_cost: boolean
  signature: string
}

type ForcedTradeOfferRecord = ForcedTradeInitialOfferRecord &
  ForcedTradeAcceptedOfferRecord
type ForcedTradeOfferRow = ForcedTradeInitialOfferRow &
  ForcedTradeAcceptedOfferRow

export class ForcedTradeOfferRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.addInitialOffer = this.wrapAdd(this.addInitialOffer)
    this.addAcceptedOffer = this.wrapAdd(this.addAcceptedOffer)
    this.findInitialOfferById = this.wrapFind(this.findInitialOfferById)
    this.findAcceptedOfferById = this.wrapFind(this.findAcceptedOfferById)
    this.findOfferById = this.wrapFind(this.findOfferById)
    this.getAllInitialOffers = this.wrapGet(this.getAllInitialOffers)
    this.getAllAcceptedOffers = this.wrapGet(this.getAllAcceptedOffers)
    this.deleteAll = this.wrapDelete(this.deleteAll)
  }

  async addInitialOffer(
    offer: Omit<ForcedTradeInitialOfferRecord, 'id'>
  ): Promise<number> {
    const row = initialOfferToRow(offer)
    const [id] = await this.knex('initial_offers').insert(row).returning('id')
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
    const row = acceptedOfferToRow(initialOfferId, acceptedOffer)
    await this.knex('accepted_offers').insert(row)
    return initialOfferId
  }

  async getAllInitialOffers(): Promise<ForcedTradeInitialOfferRecord[]> {
    const rows = await this.knex('initial_offers').select('*')
    return rows.map(initialOfferToRecord)
  }

  async getAllAcceptedOffers(): Promise<ForcedTradeAcceptedOfferRecord[]> {
    const rows = await this.knex('accepted_offers').select('*')
    this.logger.debug({
      method: 'getAllAcceptedOffers',
      rows: rows.length,
    })
    return rows.map(acceptedOfferToRecord)
  }

  async findInitialOfferById(
    id: number
  ): Promise<ForcedTradeInitialOfferRecord | undefined> {
    const [offer] = await this.knex('initial_offers').where({ id })
    if (!offer) {
      return undefined
    }
    this.logger.debug({ method: 'findInitialOfferById' })
    return initialOfferToRecord(offer)
  }

  async findAcceptedOfferById(
    id: number
  ): Promise<ForcedTradeAcceptedOfferRecord | undefined> {
    const [row] = await this.knex('accepted_offers').where({
      initial_offer_id: id,
    })
    if (!row) {
      return undefined
    }
    this.logger.debug({ method: 'findAcceptedOfferById' })
    return acceptedOfferToRecord(row)
  }

  async findOfferById(
    id: number
  ): Promise<
    ForcedTradeOfferRecord | ForcedTradeInitialOfferRecord | undefined
  > {
    const initialOffer = await this.findInitialOfferById(id)
    const acceptedOffer = await this.findAcceptedOfferById(id)

    if (!initialOffer) {
      return undefined
    }

    return {
      ...initialOffer,
      ...acceptedOffer,
    }
  }

  async getInitialOffersByStarkKey(starkKey: StarkKey) {
    const rows = await this.knex('initial_offers')
      .where('stark_key_a', starkKey)
      .select('*')

    return rows.map(initialOfferToRecord)
  }

  async getAcceptedOffersByStarkKey(
    starkKey: StarkKey
  ): Promise<ForcedTradeOfferRecord[]> {
    const rows = await this.knex('initial_offers')
      .join(
        'accepted_offers',
        'initial_offers.id',
        'accepted_offers.initial_offer_id'
      )
      .where('stark_key_b', starkKey)
      .select('*')

    return rows.map(tradeOfferToRecord)
  }

  async deleteAll() {
    return await this.knex('initial_offers').delete()
  }
}

function acceptedOfferToRow(
  initialOfferId: number,
  acceptedOffer: ForcedTradeAcceptedOfferRecord
): ForcedTradeAcceptedOfferRow {
  return {
    initial_offer_id: initialOfferId,
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
  row: ForcedTradeAcceptedOfferRow
): ForcedTradeAcceptedOfferRecord {
  return {
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

function tradeOfferToRecord(row: ForcedTradeOfferRow) {
  return {
    ...initialOfferToRecord({
      id: row.id,
      created_at: row.created_at,
      submitted_at: row.submitted_at,
      stark_key_a: row.stark_key_a,
      position_id_a: row.position_id_a,
      synthetic_asset_id: row.synthetic_asset_id,
      amount_collateral: row.amount_collateral,
      amount_synthetic: row.amount_synthetic,
      a_is_buying_synthetic: row.a_is_buying_synthetic,
    }),
    ...acceptedOfferToRecord({
      initial_offer_id: row.initial_offer_id,
      accepted_at: row.accepted_at,
      stark_key_b: row.stark_key_b,
      position_id_b: row.position_id_b,
      submission_expiration_time: row.submission_expiration_time,
      nonce: row.nonce,
      premium_cost: row.premium_cost,
      signature: row.signature,
    }),
  }
}
