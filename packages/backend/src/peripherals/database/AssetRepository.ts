import { AssetDetails, AssetType } from '@explorer/shared'
import { AssetHash, EthereumAddress, Hash256 } from '@explorer/types'
import { AssetDetailsRow, AssetRegistrationRow } from 'knex/types/tables'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export interface AssetRegistrationRecord {
  assetTypeHash: AssetHash
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
    this.getDetailsByAssetHashes = this.wrapGet(this.getDetailsByAssetHashes)
    this.findRegistrationByAssetTypeHash = this.wrapFind(
      this.findRegistrationByAssetTypeHash
    )
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async addManyDetails(records: AssetDetails[]): Promise<AssetHash[]> {
    const knex = await this.knex()
    const rows = records.map(toAssetDetailsRow)
    const hashes = await knex('asset_details')
      .insert(rows)
      .onConflict('asset_hash')
      .merge()
      .returning('asset_hash')
    return hashes.map((x) => AssetHash(x.asset_hash))
  }

  async addManyRegistrations(
    record: AssetRegistrationRecord[]
  ): Promise<Hash256[]> {
    const knex = await this.knex()
    const rows = record.map(toAssetRegistrationRow)
    const hashes = await knex('asset_registrations')
      .insert(rows)
      .onConflict('asset_type_hash')
      .merge()
      .returning('asset_type_hash')
    return hashes.map((x) => Hash256(x.asset_type_hash))
  }

  async findDetailsByAssetHash(
    assetHash: AssetHash
  ): Promise<AssetDetails | undefined> {
    const knex = await this.knex()
    const row = await knex('asset_details')
      .select()
      .where({ asset_hash: assetHash.toString() })
      .first()
    return row ? toAssetDetailsRecord(row) : undefined
  }

  async getDetailsByAssetHashes(
    assetHashes: AssetHash[]
  ): Promise<AssetDetails[]> {
    const knex = await this.knex()
    const rows = await knex('asset_details')
      .select()
      .whereIn(
        'asset_hash',
        assetHashes.map((x) => x.toString())
      )

    return rows.map((r) => toAssetDetailsRecord(r))
  }

  async getDetailsByAssetTypeAndTokenIds(
    assetTypeAndTokenIds: { assetType: AssetHash; tokenId: bigint }[]
  ): Promise<AssetDetails[]> {
    const knex = await this.knex()

    const rows = await knex('asset_details')
      .select()
      .whereIn(
        ['asset_type_hash', 'token_id'],
        assetTypeAndTokenIds.map((x) => [
          x.assetType.toString(),
          x.tokenId.toString(),
        ])
      )

    return rows.map((r) => toAssetDetailsRecord(r))
  }

  async findRegistrationByAssetTypeHash(
    assetTypeHash: AssetHash
  ): Promise<AssetRegistrationRecord | undefined> {
    const knex = await this.knex()
    const row = await knex('asset_registrations')
      .select()
      .where({ asset_type_hash: assetTypeHash.toString() })
      .first()
    return row ? toAssetRegistrationRecord(row) : undefined
  }

  async deleteAll() {
    const knex = await this.knex()
    const countA = await knex('asset_details').delete()
    const countB = await knex('asset_registrations').delete()
    return countA + countB
  }
}

function toAssetDetailsRow(record: AssetDetails): AssetDetailsRow {
  return {
    asset_hash: record.assetHash.toString(),
    asset_type_hash: record.assetTypeHash.toString(),
    type: record.type,
    quantum: record.quantum.toString(),
    address: 'address' in record ? record.address.toString() : null,
    name: record.name ?? null,
    symbol: record.symbol ?? null,
    decimals: 'decimals' in record ? record.decimals ?? null : null,
    token_id: 'tokenId' in record ? record.tokenId.toString() : null,
    uri: 'uri' in record ? record.uri ?? null : null,
    minting_blob: 'mintingBlob' in record ? record.mintingBlob : null,
    contract_error: JSON.stringify(record.contractError),
  }
}

function toAssetRegistrationRow(
  record: AssetRegistrationRecord
): AssetRegistrationRow {
  return {
    asset_type_hash: record.assetTypeHash.toString(),
    type: record.type,
    quantum: record.quantum.toString(),
    address: record.address?.toString() ?? null,
    name: record.name ?? null,
    symbol: record.symbol ?? null,
    decimals: record.decimals ?? null,
    contract_error: JSON.stringify(record.contractError),
  }
}

function toAssetDetailsRecord(row: AssetDetailsRow): AssetDetails {
  switch (row.type) {
    case 'ETH': {
      return {
        assetHash: AssetHash(row.asset_hash),
        assetTypeHash: AssetHash(row.asset_type_hash),
        type: 'ETH',
        quantum: BigInt(row.quantum),
        name: 'Ethereum',
        symbol: 'ETH',
        contractError: row.contract_error as unknown[],
      }
    }
    case 'ERC20': {
      if (!row.address) {
        throw new Error('invalid row: missing address')
      }
      return {
        assetHash: AssetHash(row.asset_hash),
        assetTypeHash: AssetHash(row.asset_type_hash),
        type: 'ERC20',
        quantum: BigInt(row.quantum),
        address: EthereumAddress(row.address),
        name: row.name ?? undefined,
        symbol: row.symbol ?? undefined,
        decimals: row.decimals ?? undefined,
        contractError: row.contract_error as unknown[],
      }
    }
    case 'ERC721': {
      if (!row.address) {
        throw new Error('invalid row: missing address')
      }
      if (!row.token_id) {
        throw new Error('invalid row: missing token_id')
      }
      return {
        assetHash: AssetHash(row.asset_hash),
        assetTypeHash: AssetHash(row.asset_type_hash),
        type: 'ERC721',
        quantum: BigInt(row.quantum),
        address: EthereumAddress(row.address),
        tokenId: BigInt(row.token_id),
        name: row.name ?? undefined,
        symbol: row.symbol ?? undefined,
        uri: row.uri ?? undefined,
        contractError: row.contract_error as unknown[],
      }
    }
    case 'ERC1155': {
      if (!row.address) {
        throw new Error('invalid row: missing address')
      }
      if (!row.token_id) {
        throw new Error('invalid row: missing token_id')
      }
      return {
        assetHash: AssetHash(row.asset_hash),
        assetTypeHash: AssetHash(row.asset_type_hash),
        type: 'ERC1155',
        quantum: BigInt(row.quantum),
        address: EthereumAddress(row.address),
        tokenId: BigInt(row.token_id),
        name: row.name ?? undefined,
        symbol: row.symbol ?? undefined,
        uri: row.uri ?? undefined,
        contractError: row.contract_error as unknown[],
      }
    }
    case 'MINTABLE_ERC20': {
      if (!row.address) {
        throw new Error('invalid row: missing address')
      }
      if (!row.minting_blob) {
        throw new Error('invalid row: missing minting_blob')
      }
      return {
        assetHash: AssetHash(row.asset_hash),
        assetTypeHash: AssetHash(row.asset_type_hash),
        type: 'MINTABLE_ERC20',
        quantum: BigInt(row.quantum),
        address: EthereumAddress(row.address),
        name: row.name ?? undefined,
        symbol: row.symbol ?? undefined,
        decimals: row.decimals ?? undefined,
        mintingBlob: row.minting_blob,
        contractError: row.contract_error as unknown[],
      }
    }
    case 'MINTABLE_ERC721': {
      if (!row.address) {
        throw new Error('invalid row: missing address')
      }
      if (!row.minting_blob) {
        throw new Error('invalid row: missing minting_blob')
      }
      return {
        assetHash: AssetHash(row.asset_hash),
        assetTypeHash: AssetHash(row.asset_type_hash),
        type: 'MINTABLE_ERC721',
        quantum: BigInt(row.quantum),
        address: EthereumAddress(row.address),
        name: row.name ?? undefined,
        symbol: row.symbol ?? undefined,
        uri: row.uri ?? undefined,
        mintingBlob: row.minting_blob,
        contractError: row.contract_error as unknown[],
      }
    }
    default:
      throw new Error(`invalid row: unknown asset type: ${row.type}`)
  }
}

function toAssetRegistrationRecord(
  row: AssetRegistrationRow
): AssetRegistrationRecord {
  return {
    assetTypeHash: AssetHash(row.asset_type_hash),
    type: row.type as AssetType,
    quantum: BigInt(row.quantum),
    address: row.address ? EthereumAddress(row.address) : undefined,
    name: row.name ?? undefined,
    symbol: row.symbol ?? undefined,
    decimals: row.decimals ?? undefined,
    contractError: row.contract_error as unknown[], // Does this make sense?
  }
}
