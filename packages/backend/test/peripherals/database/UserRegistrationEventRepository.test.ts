import { EthereumAddress } from '@explorer/types'
import { expect } from 'earljs'

import { UserRegistrationEventRepository } from '../../../src/peripherals/database/UserRegistrationEventRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(UserRegistrationEventRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new UserRegistrationEventRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record = {
      blockNumber: 1,
      ethAddress: EthereumAddress.ZERO,
      starkKey: '0x1234',
    }

    await repository.add([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([
      {
        ...record,
        id: expect.a(Number),
      },
    ])
  })

  it('adds 0 records', async () => {
    await repository.add([])
    expect(await repository.getAll()).toEqual([])
  })

  it('adds multiple records and queries them', async () => {
    const records = [
      {
        blockNumber: 1,
        ethAddress: EthereumAddress.ZERO,
        starkKey: '0x1234',
      },
      {
        blockNumber: 2,
        ethAddress: EthereumAddress.ZERO,
        starkKey: '0x1235',
      },
    ]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('deletes all records', async () => {
    await repository.add([
      {
        blockNumber: 1,
        ethAddress: EthereumAddress.ZERO,
        starkKey: '0x1234',
      },
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    await repository.add([
      {
        blockNumber: 1,
        ethAddress: EthereumAddress.ZERO,
        starkKey: '0x123',
      },
      {
        blockNumber: 2,
        ethAddress: EthereumAddress.ZERO,
        starkKey: '0x234',
      },
      {
        blockNumber: 3,
        ethAddress: EthereumAddress.ZERO,
        starkKey: '0x345',
      },
    ])

    await repository.deleteAllAfter(2)

    const actual = await repository.getAll()
    expect(actual).toEqual([
      {
        id: expect.a(Number),
        blockNumber: 1,
        ethAddress: EthereumAddress.ZERO,
        starkKey: '0x123',
      },
      {
        id: expect.a(Number),
        blockNumber: 2,
        ethAddress: EthereumAddress.ZERO,
        starkKey: '0x234',
      },
    ])
  })
})
