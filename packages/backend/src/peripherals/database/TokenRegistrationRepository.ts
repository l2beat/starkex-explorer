import { EthereumAddress } from '@explorer/types'
import { TokenRegistrationRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface TokenRegistrationRecord {
  assetType: string
  address: EthereumAddress
  type: string
}

export class TokenRegistrationRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)
    console.log("It's not a useless constructor")
  }

  async add(record: TokenRegistrationRecord) {
    const knex = await this.knex()
    await knex('token_registrations').insert(toRow(record))
    return record.assetType
  }

  async getAll(): Promise<TokenRegistrationRecord[]> {
    const knex = await this.knex()
    const rows = await knex('token_registrations').select('*')
    return rows.map(toRecord)
  }

  async findByAssetType(assetType: string) {
    const knex = await this.knex()
    const row = await knex('token_registrations')
      .where('asset_type', assetType)
      .first()

    if (!row) {
      return undefined
    }

    return toRecord(row)
  }
}

function toRow(record: TokenRegistrationRecord): TokenRegistrationRow {
  const { assetType, address, type } = record

  return {
    asset_type: assetType,
    address: address.toString(),
    type,
  }
}

function toRecord(row: TokenRegistrationRow): TokenRegistrationRecord {
  const { asset_type, address, type } = row

  return {
    assetType: asset_type,
    address: EthereumAddress(address),
    type,
  }
}
