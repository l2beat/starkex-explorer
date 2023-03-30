import { OraclePrice } from '@explorer/encoding'
import { AssetId, Hash256, PedersenHash, Timestamp } from '@explorer/types'
import { Knex } from 'knex'
import { PriceRow, StateUpdateRow } from 'knex/types/tables'

import { PaginationOptions } from '../../model/PaginationOptions'
import { Logger } from '../../tools/Logger'
import {
  PositionRecord,
  toPositionRow,
  toPositionWithPricesRecord,
} from './PositionRepository'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'
import { toVaultRow, VaultRecord } from './VaultRepository'

export interface StateUpdateRecord {
  id: number
  blockNumber: number
  stateTransitionHash: Hash256
  rootHash: PedersenHash
  timestamp: Timestamp
}

export interface StateUpdatePriceRecord {
  assetId: AssetId
  price: bigint
}

export class StateUpdateRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.findLast = this.wrapFind(this.findLast)
    this.findLastUntilBlockNumber = this.wrapFind(this.findLastUntilBlockNumber)
    this.findById = this.wrapFind(this.findById)
    this.findIdByRootHash = this.wrapFind(this.findIdByRootHash)
    this.getAll = this.wrapGet(this.getAll)
    this.getPaginated = this.wrapGet(this.getPaginated)
    this.count = this.wrapAny(this.count)
    this.findByIdWithPositions = this.wrapFind(this.findByIdWithPositions)
    this.deleteAll = this.wrapDelete(this.deleteAll)
    this.deleteAfter = this.wrapDelete(this.deleteAfter)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async add({
    stateUpdate,
    positions,
    prices,
    transactionHashes,
    vaults, // TODO: add test coverage for vaults
  }: StateUpdateBundle) {
    const knex = await this.knex()
    await knex.transaction(async (trx) => {
      await trx('state_updates').insert([toStateUpdateRow(stateUpdate)])

      if (positions.length > 0)
        await trx('positions').insert(
          positions.map((pos) => toPositionRow(pos, stateUpdate.id))
        )

      if (vaults && vaults.length > 0)
        await trx('vaults').insert(
          vaults.map((vault) => toVaultRow(vault, stateUpdate.id))
        )

      if (prices.length > 0)
        await trx('prices').insert(
          prices.map((price) => toPriceRow(price, stateUpdate.id))
        )

      if (transactionHashes && transactionHashes.length > 0)
        await trx('forced_transactions')
          .update({ state_update_id: stateUpdate.id })
          .whereIn('hash', transactionHashes.map(String))
    })
    return stateUpdate.id
  }

  async findLast(): Promise<StateUpdateRecord | undefined> {
    const knex = await this.knex()
    const row = await knex('state_updates').orderBy('id', 'desc').first()
    return row && toStateUpdateRecord(row)
  }

  async findLastUntilBlockNumber(
    blockNumber: number
  ): Promise<StateUpdateRecord | undefined> {
    const knex = await this.knex()
    const row = await knex('state_updates')
      .where('block_number', '<=', blockNumber)
      .orderBy('id', 'desc')
      .first()
    return row && toStateUpdateRecord(row)
  }

  async findById(
    id: number,
    trx?: Knex.Transaction
  ): Promise<StateUpdateRecord | undefined> {
    const knex = await this.knex(trx)
    const row = await knex('state_updates').where('id', id).first()
    return row && toStateUpdateRecord(row)
  }

  async findIdByRootHash(hash: PedersenHash): Promise<number | undefined> {
    const knex = await this.knex()
    const row = await knex('state_updates')
      .where('root_hash', hash.toString())
      .first('id')
    return row?.id
  }

  async getAll() {
    const knex = await this.knex()
    const rows = await knex('state_updates').select('*')
    return rows.map(toStateUpdateRecord)
  }

  async getPricesByStateUpdateId(
    stateUpdateId: number,
    trx?: Knex.Transaction
  ) {
    const knex = await this.knex(trx)
    const rows = await knex('prices')
      .select(['asset_id', 'price'])
      .where('state_update_id', stateUpdateId)
    return rows.map(toStateUpdatePriceRecord)
  }

  async getPaginated({ offset, limit }: PaginationOptions) {
    interface Row {
      id: number
      root_hash: string
      timestamp: number
      position_count: bigint
      forced_transactions_count: number
    }
    const knex = await this.knex()
    const rows = (await knex('state_updates')
      .orderBy('timestamp', 'desc')
      .offset(offset)
      .limit(limit)
      .leftJoin('positions', 'state_updates.id', 'positions.state_update_id')
      .leftJoin(
        'forced_transactions',
        'state_updates.id',
        'forced_transactions.state_update_id'
      )
      .groupBy('root_hash', 'id', 'timestamp')
      .select(
        'id',
        'root_hash',
        'timestamp',
        knex.raw('count(distinct position_id) as position_count'),
        knex.raw('count(distinct hash) as forced_transactions_count')
      )) as Row[]

    return rows.map((row) => ({
      id: row.id,
      rootHash: PedersenHash(row.root_hash),
      timestamp: Timestamp(row.timestamp),
      positionCount: Number(row.position_count),
      forcedTransactionsCount: Number(row.forced_transactions_count),
    }))
  }

  async count() {
    const knex = await this.knex()
    const [result] = await knex('state_updates').count()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Number(result!.count!)
  }

  async findByIdWithPositions(id: number) {
    const knex = await this.knex()
    const [update, positions] = await Promise.all([
      knex('state_updates').where('id', '=', id).first(),
      knex('positions')
        .where('positions.state_update_id', '=', id)
        .leftJoin(
          'prices',
          'prices.state_update_id',
          'positions.state_update_id'
        )
        .groupBy('positions.position_id', 'positions.state_update_id')
        .select(
          'positions.*',
          knex.raw('array_agg(row_to_json(prices)) as prices')
        ),
    ])

    if (!update) {
      return undefined
    }

    return {
      id,
      hash: Hash256(update.state_transition_hash),
      rootHash: PedersenHash(update.root_hash),
      blockNumber: update.block_number,
      timestamp: Timestamp(update.timestamp),
      positions: positions.map(toPositionWithPricesRecord),
    }
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('state_updates').delete()
  }

  async deleteAfter(blockNumber: number) {
    const knex = await this.knex()
    return knex('state_updates')
      .where('block_number', '>', blockNumber)
      .delete()
  }
}

export interface StateUpdateBundle {
  stateUpdate: StateUpdateRecord
  positions: PositionRecord[]
  prices: OraclePrice[]
  transactionHashes?: Hash256[]
  vaults?: VaultRecord[]
}

function toStateUpdateRecord(row: StateUpdateRow): StateUpdateRecord {
  return {
    id: row.id,
    blockNumber: row.block_number,
    stateTransitionHash: Hash256(row.state_transition_hash),
    rootHash: PedersenHash(row.root_hash),
    timestamp: Timestamp(row.timestamp),
  }
}

function toStateUpdateRow(record: StateUpdateRecord): StateUpdateRow {
  return {
    id: record.id,
    block_number: record.blockNumber,
    state_transition_hash: record.stateTransitionHash.toString(),
    root_hash: record.rootHash.toString(),
    timestamp: BigInt(Number(record.timestamp)),
  }
}

function toPriceRow(record: OraclePrice, stateUpdateId: number): PriceRow {
  return {
    state_update_id: stateUpdateId,
    asset_id: record.assetId.toString(),
    price: record.price,
  }
}

function toStateUpdatePriceRecord(
  record: Pick<PriceRow, 'asset_id' | 'price'>
): StateUpdatePriceRecord {
  return {
    assetId: AssetId(record.asset_id),
    price: record.price,
  }
}
