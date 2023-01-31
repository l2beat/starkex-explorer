import { TokenRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface TokenRecord {
  assetTypeHash: string
  assetHash: string
  tokenId: string
  uri: string
  contractError: string | null
}

export class TokenRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.add = this.wrapAdd(this.add)
    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
  }

  async add(record: TokenRecord) {
    const knex = await this.knex()
    await knex('tokens').insert(toRow(record))
    return record.assetTypeHash
  }

  async addMany(records: TokenRecord[]) {
    const knex = await this.knex()
    const rows = records.map(toRow)
    const hashes = await knex('tokens')
      .insert(rows)
      .returning('asset_type_hash')
    return hashes.map((x) => x.asset_type_hash)
  }

  async getAll(): Promise<TokenRecord[]> {
    const knex = await this.knex()
    const rows = await knex('tokens').select('*')
    return rows.map(toRecord)
  }
}

function toRow(record: TokenRecord): TokenRow {
  const { assetTypeHash, assetHash, tokenId, uri, contractError } = record

  return {
    asset_type_hash: assetTypeHash,
    asset_hash: assetHash,
    token_id: tokenId,
    uri,
    contract_error: contractError,
  }
}

function toRecord(row: TokenRow): TokenRecord {
  const { asset_type_hash, asset_hash, token_id, uri, contract_error } = row

  return {
    assetTypeHash: asset_type_hash,
    assetHash: asset_hash,
    tokenId: token_id,
    uri,
    contractError: contract_error,
  }
}
