import {
  AssetDetails,
  AssetType,
  ERC20Details,
  ERC721Details,
} from '@explorer/shared'
import { AssetHash, EthereumAddress } from '@explorer/types'
import { expect } from 'earljs'
import { BigNumber } from 'ethers'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { AssetRegistrationRecord, AssetRepository } from './AssetRepository'

describe(AssetRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const assetRepository = new AssetRepository(database, Logger.SILENT)

  afterEach(async () => {
    await assetRepository.deleteAll()
  })

  describe(AssetRepository.prototype.addManyDetails.name, () => {
    it('adds single record and queries it', async () => {
      const record: AssetDetails = dummyAsset('1', '2')

      await assetRepository.addManyDetails([record])

      const actual = await assetRepository.findDetailsByAssetHash(
        record.assetHash
      )

      expect(actual).toEqual(record)
    })

    it('merges single record on conflict', async () => {
      const record: AssetDetails = dummyAsset('1', '2')
      record.quantum = 11n

      const recordUpdated: AssetDetails = {
        ...record,
        quantum: 22n,
      }

      await assetRepository.addManyDetails([record])
      await assetRepository.addManyDetails([recordUpdated])
      const actual = await assetRepository.findDetailsByAssetHash(
        record.assetHash
      )
      expect(actual).toEqual(recordUpdated)
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
  })

  describe(AssetRepository.prototype.addManyRegistrations.name, () => {
    it('adds single record and queries it', async () => {
      const record: AssetRegistrationRecord = dummyAssetRegistration('1')

      await assetRepository.addManyRegistrations([record])

      const actual = await assetRepository.findRegistrationByAssetTypeHash(
        record.assetTypeHash
      )

      expect(actual).toEqual(record)
    })

    it('merges single record on conflict', async () => {
      const record: AssetRegistrationRecord = dummyAssetRegistration('1')
      record.quantum = 11n
      const recordUpdated: AssetRegistrationRecord = {
        ...record,
        quantum: 22n,
      }

      await assetRepository.addManyRegistrations([record])
      await assetRepository.addManyRegistrations([recordUpdated])

      const actual = await assetRepository.findRegistrationByAssetTypeHash(
        record.assetTypeHash
      )
      expect(actual).toEqual(recordUpdated)
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
  })

  describe(AssetRepository.prototype.deleteAll.name, () => {
    it('deletes all records', async () => {
      await assetRepository.addManyRegistrations([
        dummyAssetRegistration('1'),
        dummyAssetRegistration('2'),
      ])

      const count = await assetRepository.deleteAll()

      expect(count).toEqual(2)
    })
  })

  describe(AssetRepository.prototype.getDetailsByAssetHashes.name, () => {
    it('returns empty array if no records', async () => {
      const actual = await assetRepository.getDetailsByAssetHashes([
        AssetHash.fake('1'),
        AssetHash.fake('2'),
      ])

      expect(actual).toEqual([])
    })

    it('returns empty array if no records match', async () => {
      await assetRepository.addManyDetails([
        dummyAsset('1', '1'),
        dummyAsset('2', '2'),
      ])

      const actual = await assetRepository.getDetailsByAssetHashes([
        AssetHash.fake('3'),
        AssetHash.fake('4'),
      ])

      expect(actual).toEqual([])
    })

    it('returns records that match', async () => {
      const records = [
        dummyAsset('1', '1'),
        dummyAsset('2', '2'),
        dummyAsset('3', '3'),
      ]

      await assetRepository.addManyDetails(records)

      const actual = await assetRepository.getDetailsByAssetHashes([
        records[0]!.assetHash,
        records[2]!.assetHash,
      ])

      expect(actual).toEqual([records[0]!, records[2]!])
    })
  })

  describe(
    AssetRepository.prototype.getDetailsByAssetTypeAndTokenIds.name,
    () => {
      it('returns empty array if no records', async () => {
        const actual = await assetRepository.getDetailsByAssetTypeAndTokenIds([
          {
            assetType: AssetHash.fake('1'),
            tokenId: 1n,
          },
        ])

        expect(actual).toEqual([])
      })

      it('returns empty array if no records match', async () => {
        await assetRepository.addManyDetails([
          dummyAssetWithTokenId('1', '1', 1n),
          dummyAssetWithTokenId('2', '2', 2n),
        ])

        const actual = await assetRepository.getDetailsByAssetTypeAndTokenIds([
          { assetType: AssetHash.fake('3'), tokenId: 3n },
        ])

        expect(actual).toEqual([])
      })

      it('returns records that match', async () => {
        const records = [
          dummyAssetWithTokenId('1', '1', 1n),
          dummyAssetWithTokenId('2', '2', 2n),
          dummyAssetWithTokenId('3', '3', 3n),
        ]

        await assetRepository.addManyDetails(records)

        const actual = await assetRepository.getDetailsByAssetTypeAndTokenIds([
          {
            assetType: records[0]!.assetTypeHash,
            tokenId: records[0]!.tokenId,
          },
          {
            assetType: records[2]!.assetTypeHash,
            tokenId: records[2]!.tokenId,
          },
        ])

        expect(actual).toEqual([records[0]!, records[2]!])
      })
    }
  )
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
): ERC20Details {
  return {
    assetTypeHash: AssetHash.fake(assetTypeHash),
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

function dummyAssetWithTokenId(
  assetTypeHash: string,
  assetHash: string,
  tokenId: bigint
): ERC721Details {
  const { decimals: _, ...rest } = dummyAsset(assetTypeHash, assetHash)
  return {
    ...rest,
    type: 'ERC721',
    tokenId,
    uri: undefined,
  }
}

export function dummyAssetRegistration(
  assetTypeHash: string,
  address = EthereumAddress.fake(),
  type = 'ERC20' as AssetType,
  name = undefined,
  symbol = undefined,
  quantum = 1n,
  decimals = undefined,
  contractError = []
): AssetRegistrationRecord {
  return {
    assetTypeHash: AssetHash.fake(assetTypeHash),
    address,
    type,
    name,
    symbol,
    quantum,
    decimals,
    contractError,
  }
}
