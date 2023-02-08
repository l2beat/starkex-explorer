import { AssetHash, EthereumAddress, Hash256 } from '@explorer/types'
import { AssetDetailsRow, AssetRegistrationRow } from 'knex/types/tables'

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
    const hashes = await knex('asset_details')
      .insert(rows)
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

  async findRegistrationByAssetTypeHash(
    assetTypeHash: Hash256
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
        symbol: record.symbol ?? null,
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

function toAssetRegistrationRow(record: AssetRegistrationRecord): AssetRegistrationRow {
  return {
    asset_type_hash: record.assetTypeHash.toString(),
    type: record.type,
    quantum: record.quantum.toString(),
    address: record.address?.toString() ?? null,
    name: record.name ?? null,
    symbol: record.symbol ?? null,
    decimals: record.decimals ?? null,
    contract_error: toSerializableJson(record.contractError),
  }
}

function toAssetDetailsRecord(row: AssetDetailsRow): AssetDetails {
  // I am not sure about this function, it is a bit messy
  const {
    asset_hash,
    asset_type_hash,
    type,
    quantum,
    address,
    name,
    symbol,
    decimals,
    token_id,
    uri,
    minting_blob,
    contract_error,
  } = row

  if(!address) {
    return {
      assetHash: AssetHash(asset_hash),
      assetTypeHash: Hash256(asset_type_hash),
      type: 'ETH',
      quantum: BigInt(quantum),
      name: 'Ethereum',
      symbol: 'ETH',
      contractError: Array(contract_error),
    } 
  }

  if (token_id) {
    if(type === 'ERC721') {
      return {
        assetHash: AssetHash(asset_hash),
        assetTypeHash: Hash256(asset_type_hash),
        type: 'ERC721',
        quantum: BigInt(quantum),
        address: EthereumAddress(address),
        tokenId: BigInt(token_id),
        name: name ?? undefined,
        symbol: symbol ?? undefined,
        uri: uri ?? undefined,
        contractError: Array(contract_error),
      }
    }
    return {
      assetHash: AssetHash(asset_hash),
      assetTypeHash: Hash256(asset_type_hash),
      type: 'ERC1155',
      quantum: BigInt(quantum),
      address: EthereumAddress(address),
      tokenId: BigInt(token_id),
      name: name ?? undefined,
      symbol: symbol ?? undefined,
      uri: uri ?? undefined,
      contractError: Array(contract_error),
    }
  }

  

  if (minting_blob) {
    if(type === 'MINTABLE_ERC20') {
      return {
        assetHash: AssetHash(asset_hash),
        assetTypeHash: Hash256(asset_type_hash),
        type: 'MINTABLE_ERC20',
        quantum: BigInt(quantum),
        address: EthereumAddress(address),
        name: name ?? undefined,
        symbol: symbol ?? undefined,
        decimals: decimals ?? undefined,
        mintingBlob: minting_blob,
        contractError: Array(contract_error),
      }
    }
    return {
      assetHash: AssetHash(asset_hash),
      assetTypeHash: Hash256(asset_type_hash),
      type: 'MINTABLE_ERC721',
      quantum: BigInt(quantum),
      address: EthereumAddress(address),
      name: name ?? undefined,
      symbol: symbol ?? undefined,
      uri: uri ?? undefined,
      mintingBlob: minting_blob,
      contractError: Array(contract_error),
    }
  }

  return {
    assetHash: AssetHash(asset_hash),
    assetTypeHash: Hash256(asset_type_hash),
    type: 'ERC20',
    quantum: BigInt(quantum),
    address: EthereumAddress(address),
    name: name ?? undefined,
    symbol: symbol ?? undefined,
    decimals: decimals ?? undefined,
    contractError: Array(contract_error),
  }
}

function toAssetRegistrationRecord(row: AssetRegistrationRow): AssetRegistrationRecord {
  return {
    assetTypeHash: Hash256(row.asset_type_hash),
    type: row.type as AssetType,
    quantum: BigInt(row.quantum),
    address: row.address ? EthereumAddress(row.address) : undefined,
    name: row.name ?? undefined,
    symbol: row.symbol ?? undefined,
    decimals: row.decimals ?? undefined,
    contractError: Array(row.contract_error),
  }
}
