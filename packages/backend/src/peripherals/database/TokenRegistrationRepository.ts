import { ERCType, EthereumAddress } from '@explorer/types'
import { BigNumber } from 'ethers'
import { TokenRegistrationRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface TokenRegistrationRecord {
  assetTypeHash: string
  address: EthereumAddress
  type: ERCType
  name: string | null
  symbol: string | null
  quantum: BigNumber
  decimals: number | null
  contractError: string | null
}

export class TokenRegistrationRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.addMany = this.wrapAddMany(this.addMany)
    this.findByAssetType = this.wrapFind(this.findByAssetType)
    this.getAll = this.wrapGet(this.getAll)
  }

  async add(record: TokenRegistrationRecord) {
    const knex = await this.knex()
    await knex('token_registrations').insert(toRow(record))
    return record.assetTypeHash
  }

  async addMany(records: TokenRegistrationRecord[]) {
    const knex = await this.knex()
    const rows = records.map(toRow)
    const hashes = await knex('token_registrations')
      .insert(rows)
      .returning('asset_type_hash')
    return hashes.map((x) => x.asset_type_hash)
  }

  async getAll(): Promise<TokenRegistrationRecord[]> {
    const knex = await this.knex()
    const rows = await knex('token_registrations').select('*')
    return rows.map(toRecord)
  }

  async findByAssetType(assetTypeHash: string) {
    const knex = await this.knex()
    const row = await knex('token_registrations')
      .where('asset_type_hash', assetTypeHash)
      .first()

    if (!row) {
      return undefined
    }

    return toRecord(row)
  }

  async deleteAll() {
    const knex = await this.knex()
    return knex('token_registrations').delete()
  }
}

function toRow(record: TokenRegistrationRecord): TokenRegistrationRow {
  const { assetTypeHash, address, contractError, type, quantum, ...rest } =
    record

  return {
    asset_type_hash: assetTypeHash,
    address: address.toString(),
    type: type.toString(),
    quantum: quantum.toString(),
    contract_error: contractError,
    ...rest,
  }
}

function toRecord(row: TokenRegistrationRow): TokenRegistrationRecord {
  const { asset_type_hash, address, contract_error, type, quantum, ...rest } =
    row

  return {
    assetTypeHash: asset_type_hash,
    address: EthereumAddress(address),
    type: ERCType(type),
    quantum: BigNumber.from(quantum),
    contractError: contract_error,
    ...rest,
  }
}
