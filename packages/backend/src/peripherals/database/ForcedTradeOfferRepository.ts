import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { Knex } from 'knex'

import { Logger } from '../../tools/Logger'

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

export interface ForcedTradeAcceptRecord {
  acceptedAt: Timestamp
  starkKeyB: StarkKey
  positionIdB: bigint
  submissionExpirationTime: Timestamp
  nonce: bigint
  premiumCost: boolean

  // https://github.com/starkware-libs/starkex-contracts/blob/StarkExchange-v3.0/scalable-dex/contracts/src/perpetual/interactions/ForcedTrades.sol#L138-L181
  signature: string // HEX string signature of all parameters
}

interface ForcedTradeAcceptRow {
  initial_offer_id: number
  accepted_at: number
  stark_key_b: string
  position_id_b: bigint
  submission_expiration_time: number
  nonce: bigint
  premium_cost: boolean
  signature: string
}

type ForcedTradeOfferRecord = ForcedTradeInitialOfferRecord &
  ForcedTradeAcceptRecord

export class ForcedTradeOfferRepository {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async addInitialOffer(
    offer: Omit<ForcedTradeInitialOfferRecord, 'id'>
  ): Promise<number> {
    const row = initialOfferToRow(offer)
    const [id] = await this.knex('initial_offers').insert(row).returning('id')
    this.logger.debug({ method: 'add' })
    return id
  }

  async addAcceptOffer(
    initialOfferId: number,
    acceptOffer: ForcedTradeAcceptRecord
  ): Promise<void> {
    const row = acceptOfferToRow(initialOfferId, acceptOffer)
    await this.knex('accept_offers').insert(row)
    this.logger.debug({ method: 'addAcceptOffer' })
  }

  async getAllInitialOffers(): Promise<ForcedTradeInitialOfferRecord[]> {
    const rows = await this.knex('initial_offers').select('*')
    this.logger.debug({ method: 'getAllInitialOffers', rows: rows.length })
    return rows.map(initialOfferToRecord)
  }

  async getAllAcceptOffers(): Promise<ForcedTradeAcceptRecord[]> {
    const rows = await this.knex('accept_offers').select('*')
    this.logger.debug({
      method: 'getAllAcceptOffers',
      rows: rows.length,
    })
    return rows.map(acceptOfferToRecord)
  }

  async getInitialOfferById(
    id: number
  ): Promise<ForcedTradeInitialOfferRecord | undefined> {
    const [offer] = await this.knex('initial_offers').where({ id })
    if (!offer) {
      return undefined
    }
    this.logger.debug({ method: 'getInitialOfferById' })
    return initialOfferToRecord(offer)
  }

  async getAcceptOfferById(id: number): Promise<ForcedTradeAcceptRecord> {
    const [row] = await this.knex('accept_offers').where({
      initial_offer_id: id,
    })
    this.logger.debug({ method: 'getAcceptOfferById' })
    return acceptOfferToRecord(row)
  }

  async getOfferById(id: number): Promise<ForcedTradeOfferRecord> {
    const offer = await this.getInitialOfferById(id)
    const acceptOffer = await this.getAcceptOfferById(id)

    return {
      ...offer,
      ...acceptOffer,
    }
  }

  async deleteAll() {
    await this.knex('initial_offers').delete()
    this.logger.debug({ method: 'deleteAll' })
  }
}

function acceptOfferToRow(
  initialOfferId: number,
  acceptOffer: ForcedTradeAcceptRecord
): ForcedTradeAcceptRow {
  return {
    initial_offer_id: initialOfferId,
    accepted_at: acceptOffer.acceptedAt as unknown as number,
    stark_key_b: acceptOffer.starkKeyB.toString(),
    position_id_b: acceptOffer.positionIdB,
    submission_expiration_time:
      acceptOffer.submissionExpirationTime as unknown as number,
    nonce: acceptOffer.nonce,
    premium_cost: acceptOffer.premiumCost,
    signature: acceptOffer.signature,
  }
}

function acceptOfferToRecord(
  row: ForcedTradeAcceptRow
): ForcedTradeAcceptRecord {
  return {
    acceptedAt: Timestamp(row.accepted_at),
    starkKeyB: StarkKey(row.stark_key_b),
    positionIdB: row.position_id_b,
    submissionExpirationTime: Timestamp(row.submission_expiration_time),
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
