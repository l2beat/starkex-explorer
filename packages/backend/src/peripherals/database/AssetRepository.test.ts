import { AssetHash, EthereumAddress, Hash256 } from '@explorer/types'
import { expect } from 'earljs'
import { BigNumber } from 'ethers'

import { AssetDetails, AssetType } from '../../model/AssetDetails'
import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { AssetRegistrationRecord, AssetRepository } from './AssetRepository'

describe(AssetRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const assetRepository = new AssetRepository(database, Logger.SILENT)

  afterEach(async () => {
    await assetRepository.deleteAll()
  })

  it('adds single record and queries it', async () => {
    const record: AssetDetails = dummyAsset('1', '2')

    await assetRepository.addManyDetails([record])

    const actual = await assetRepository.findDetailsByAssetHash(
      record.assetHash
    )

    expect(actual).toEqual(record)
  })

  it('adds multiple records and queries them', async () => {
    const records = [
      dummyAsset('10', '11'),
      dummyAsset('11', '12'),
      dummyAsset('12', '13'),
    ]

    await assetRepository.addManyDetails(records)
    const actual = await Promise.all(
      records.map(
        async (record) =>
          await assetRepository.findDetailsByAssetHash(record.assetHash)
      )
    )

    expect(actual).toEqual(records)
  })

  it('adds single record and queries it', async () => {
    const record: AssetRegistrationRecord = dummyAssetRegistration('1')

    await assetRepository.addManyRegistrations([record])

    const actual = await assetRepository.findRegistrationByAssetTypeHash(
      record.assetTypeHash
    )

    expect(actual).toEqual(record)
  })

  it('adds multiple records and queries them', async () => {
    const records = [
      dummyAssetRegistration('10'),
      dummyAssetRegistration('11'),
      dummyAssetRegistration('12'),
    ]

    await assetRepository.addManyRegistrations(records)

    const actual = await Promise.all(
      records.map(
        async (record) =>
          await assetRepository.findRegistrationByAssetTypeHash(
            record.assetTypeHash
          )
      )
    )

    expect(actual).toEqual(records)
  })

  it('deletes all records', async () => {
    await assetRepository.addManyRegistrations([
      dummyAssetRegistration('1'),
      dummyAssetRegistration('2'),
    ])

    const count = await assetRepository.deleteAll()

    expect(count).toEqual(2)
  })
})

function dummyAsset(
  assetTypeHash: string,
  assetHash: string,
  name = undefined,
  symbol = undefined,
  decimals = undefined,
  quantum = BigNumber.from(1).toBigInt(),
  address: EthereumAddress = EthereumAddress.fake(),
  contractError = []
): AssetDetails {
  return {
    assetTypeHash: Hash256.fake(assetTypeHash),
    assetHash: AssetHash.fake(assetHash),
    type: 'ERC20',
    name,
    symbol,
    decimals,
    quantum,
    address,
    contractError,
  }
}

export function dummyAssetRegistration(
  assetTypeHash: string,
  address = EthereumAddress.fake(),
  type = 'ERC20' as AssetType,
  name = undefined,
  symbol = undefined,
  quantum = BigNumber.from(1).toBigInt(),
  decimals = undefined,
  contractError = []
): AssetRegistrationRecord {
  return {
    assetTypeHash: Hash256.fake(assetTypeHash),
    address,
    type,
    name,
    symbol,
    quantum,
    decimals,
    contractError,
  }
}
