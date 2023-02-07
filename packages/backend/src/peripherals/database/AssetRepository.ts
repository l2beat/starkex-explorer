import { AssetHash, EthereumAddress, Hash256 } from '@explorer/types'
import { AssetDetailsRow } from 'knex/types/tables'

import { AssetDetails, AssetType } from '../../model/AssetDetails'
import { Logger } from '../../tools/Logger'
import { toSerializableJson } from '../../utils/toSerializableJson'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface AssetRegistrationRecord {
  assetTypeHash: Hash256
  type: AssetType
  quantum: bigint
  address?: EthereumAddress
  name?: string
  symbol?: string
  decimals?: number
  contractError: unknown[]
}

export class AssetRepository extends BaseRepository {
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.addManyDetails = this.wrapAddMany(this.addManyDetails)
    this.addManyRegistrations = this.wrapAddMany(this.addManyRegistrations)
    this.findDetailsByAssetHash = this.wrapFind(this.findDetailsByAssetHash)
    this.findRegistrationByAssetTypeHash = this.wrapFind(
      this.findRegistrationByAssetTypeHash
    )
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addManyDetails(records: AssetDetails[]): Promise<AssetHash[]> {
    const knex = await this.knex()
    const rows = records.map(toAssetDetailsRow)
    const hashes = await knex('asset_details').insert(rows).returning('asset_hash')
    return hashes.map((x) => AssetHash(x.asset_hash))
  }

  async addManyRegistrations(record: AssetRegistrationRecord[]): Promise<Hash256[]> {
    throw new Error('Not implemented')
  }

  async findDetailsByAssetHash(
    assetHash: AssetHash
  ): Promise<AssetDetails | undefined> {
    throw new Error('Not implemented')
  }

  async findRegistrationByAssetTypeHash(
    assetTypeHash: Hash256
  ): Promise<AssetRegistrationRecord | undefined> {
    throw new Error('Not implemented')
  }

  async deleteAll() {
    const knex = await this.knex()
    const countA = await knex('asset_details').delete()
    const countB = await knex('asset_registrations').delete()
    return countA + countB
  }
}

function toAssetDetailsRow(record: AssetDetails): AssetDetailsRow {
  const { assetHash, assetTypeHash, type, quantum, contractError } = record

  const base = {
    asset_hash: assetHash.toString(),
    asset_type_hash: assetTypeHash.toString(),
    type,
    quantum: quantum.toString(),
    contract_error: toSerializableJson(contractError),
  }

  switch (type) {
    case 'ETH':
      return {
        address: null,
        decimals: null,
        token_id: null,
        uri: null,
        minting_blob: null,
        name: record.name,
        symbol: record.symbol,
        ...base,
      }
    case 'ERC20':
      return {
        address: record.address.toString(),
        decimals: record.decimals ?? null,
        name: record.name ?? null,
        symbol: record.symbol ??  null,
        token_id: null,
        uri: null,
        minting_blob: null,
        ...base,
      }
    case 'ERC721':
      return {
        address: record.address.toString(),
        decimals: null,
        name: record.name ?? null,
        symbol: record.symbol ?? null,
        token_id: record.tokenId.toString(),
        uri: record.uri ?? null,
        minting_blob: null,
        ...base,
      }
    case 'ERC1155':
      return {
        address: record.address.toString(),
        decimals: null,
        name: record.name ?? null,
        symbol: record.symbol ?? null,
        token_id: record.tokenId.toString(),
        uri: record.uri ?? null,
        minting_blob: null,
        ...base,
      }
    case 'MINTABLE_ERC721':
      return {
        address: record.address.toString(),
        decimals: null,
        name: record.name ?? null,
        symbol: record.symbol ?? null,
        token_id: null,
        uri: record.uri ?? null,
        minting_blob: record.mintingBlob,
        ...base,
    }
    case 'MINTABLE_ERC20':
      return {
        address: record.address.toString(),
        decimals: record.decimals ?? null,
        name: record.name ?? null,
        symbol: record.symbol ?? null,
        token_id: null,
        uri: null,
        minting_blob: record.mintingBlob,
        ...base,
      }
  }  
}
