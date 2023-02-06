import { SpotAssetId } from '@explorer/types'
import { TokenRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { toSerializableJson } from '../../utils/toSerializableJson'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface TokenRecord {
  assetTypeHash: string
  assetHash: SpotAssetId
  tokenId: string | null
  uri: string | null
  contractError: unknown[]
}

export class TokenRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.addMany = this.wrapAddMany(this.addMany)
    this.getAll = this.wrapGet(this.getAll)
    this.deleteAll = this.wrapDelete(this.deleteAll)
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

  async deleteAll() {
    const knex = await this.knex()
    return knex('tokens').delete()
  }
}

function toRow(record: TokenRecord): TokenRow {
  const { assetTypeHash, assetHash, tokenId, uri, contractError } = record

  return {
    asset_type_hash: assetTypeHash,
    asset_hash: assetHash.toString(),
    token_id: tokenId,
    uri,
    contract_error: toSerializableJson(contractError),
  }
}

function toRecord(row: TokenRow): TokenRecord {
  const { asset_type_hash, asset_hash, token_id, uri, contract_error } = row

  return {
    assetTypeHash: asset_type_hash,
    assetHash: SpotAssetId(asset_hash),
    tokenId: token_id,
    uri,
    contractError: Array(contract_error),
  }
}
