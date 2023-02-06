import { ERCType, EthereumAddress } from '@explorer/types'
import { expect } from 'earljs'
import { BigNumber } from 'ethers'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import {
  TokenRegistrationRecord,
  TokenRegistrationRepository,
} from './TokenRegistrationRepository'

describe(TokenRegistrationRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new TokenRegistrationRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: TokenRegistrationRecord = dummyTokenRegistration('1')

    await repository.addMany([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([{ ...record, contractError: [{}] }])
  })

  it('adds multiple records and queries them', async () => {
    const records = [
      dummyTokenRegistration('10'),
      dummyTokenRegistration('11'),
      dummyTokenRegistration('12'),
    ]

    await repository.addMany(records)
    const actual = await repository.getAll()

    records.forEach((record) => (record.contractError = [{}]))

    expect(actual).toEqual(records)
  })

  it('deletes all records', async () => {
    await repository.addMany([
      dummyTokenRegistration('1'),
      dummyTokenRegistration('2'),
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })
})

export function dummyTokenRegistration(
  assetTypeHash: string,
  address = EthereumAddress.fake(),
  type = 'ERC-20' as ERCType,
  name = null,
  symbol = null,
  quantum = BigNumber.from(1),
  decimals = null,
  contractError = []
): TokenRegistrationRecord {
  return {
    assetTypeHash,
    address,
    type,
    name,
    symbol,
    quantum,
    decimals,
    contractError,
  }
}
