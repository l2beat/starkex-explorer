import { ERCType, EthereumAddress } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { TokenRegistrationRecord, TokenRegistrationRepository } from './TokenRegistrationRepository'

describe(TokenRegistrationRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new TokenRegistrationRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: TokenRegistrationRecord = {
      assetTypeHash: '',
      address: EthereumAddress.fake(),
      type: ERCType('ERC-20'),
      name : null,
      symbol: null,
      quantum: 1,
      decimals: null,
      contractError: null
    }

    await repository.addMany([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([
      record
    ])
  })

  it('adds multiple records and queries them', async () => {
    const records = [dummyTokenRegistration('10'), dummyTokenRegistration('11'), dummyTokenRegistration('12')]

    await repository.addMany(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records)
  })

  it('deletes all records', async () => {
    await repository.addMany([dummyTokenRegistration('1'), dummyTokenRegistration('2')])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })
})

function dummyTokenRegistration(
  assetTypeHash: string,
  address = EthereumAddress.fake(),
  type = ERCType('ERC-20'),
  name = null,
  symbol = null,
  quantum = 1,
  decimals = null,
  contractError = null
): TokenRegistrationRecord {
  return {
    assetTypeHash,
    address,
    type,
    name,
    symbol,
    quantum,
    decimals,
    contractError
  }
}
