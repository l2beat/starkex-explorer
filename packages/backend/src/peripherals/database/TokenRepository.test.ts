import { SpotAssetId } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { TokenRegistrationRepository } from './TokenRegistrationRepository'
import { dummyTokenRegistration } from './TokenRegistrationRepository.test'
import { TokenRecord, TokenRepository } from './TokenRepository'

describe(TokenRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const tokenRegistrationRepository = new TokenRegistrationRepository(
    database,
    Logger.SILENT
  )
  const tokenRepository = new TokenRepository(database, Logger.SILENT)

  afterEach(async () => {
    await tokenRepository.deleteAll()
    await tokenRegistrationRepository.deleteAll()
  })

  it('adds single record and queries it', async () => {
    const record: TokenRecord = dummyToken('1', '2')

    await tokenRegistrationRepository.addMany(
      [dummyTokenRegistration(record.assetTypeHash)]
    )

    await tokenRepository.addMany([record])

    const actual = await tokenRepository.getAll()

    expect(actual).toEqual([{...record, contractError: [{}]}])
  })

  it('adds multiple records and queries them', async () => {
    const records = [
      dummyToken('10', '11'),
      dummyToken('11', '12'),
      dummyToken('12', '13'),
    ]

    await tokenRegistrationRepository.addMany(
      records.map((record) => dummyTokenRegistration(record.assetTypeHash))
    )

    await tokenRepository.addMany(records)
    const actual = await tokenRepository.getAll()

    records.forEach(record => record.contractError = [{}])

    expect(actual).toEqual(records)
  })

  it('deletes all records', async () => {
    const records = [dummyToken('1', '2'), dummyToken('2', '3')]

    await tokenRegistrationRepository.addMany(
      records.map((record) => dummyTokenRegistration(record.assetTypeHash))
    )

    await tokenRepository.addMany(records)

    await tokenRepository.deleteAll()

    const actual = await tokenRepository.getAll()
    expect(actual).toEqual([])
  })
})

function dummyToken(
  assetTypeHash: string,
  assetHash: string,
  tokenId = null,
  uri = null,
  contractError = []
): TokenRecord {
  return {
    assetTypeHash,
    assetHash: SpotAssetId(assetHash),
    tokenId,
    uri,
    contractError,
  }
}
