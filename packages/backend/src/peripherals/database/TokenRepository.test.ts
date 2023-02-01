import { SpotAssetId } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { TokenRecord, TokenRepository } from './TokenRepository'

describe(TokenRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new TokenRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: TokenRecord = {
      assetTypeHash: '',
      assetHash: SpotAssetId(''),
      tokenId: null,
      uri: null,
      contractError: null
    }

    await repository.addMany([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([
      record
    ])
  })

  it('adds multiple records and queries them', async () => {
    const records = [dummyToken('10', '11'), dummyToken('11', '12'), dummyToken('12', '13')]

    await repository.addMany(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records)
  })

  it('deletes all records', async () => {
    await repository.addMany([dummyToken('1', '2'), dummyToken('2', '3')])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })
})

function dummyToken(
  assetTypeHash: string,
  assetHash: string,
  tokenId = null,
  uri = null,
  contractError = null
): TokenRecord {
  return {
    assetTypeHash,
    assetHash: SpotAssetId(assetHash),
    tokenId,
    uri,
    contractError
  }
}
