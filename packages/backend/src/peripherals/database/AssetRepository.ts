import { AssetHash, EthereumAddress, Hash256 } from '@explorer/types'
import { AssetDetails, AssetType } from '../../model/AssetDetails'
import { Logger } from '../../tools/Logger'
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
    throw new Error('Not implemented')
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
