import { expect } from 'earljs'

import {
  VerifierEventRecord,
  VerifierEventRepository,
} from '../../../src/peripherals/database/VerifierEventRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './shared/setup'

describe(VerifierEventRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new VerifierEventRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: Omit<VerifierEventRecord, 'id'> = {
      name: 'ImplementationAdded',
      implementation: '0x0000000000000000000000000000000000000000',
      initializer: '0x0000000000000000000000000000000000000000',
      blockNumber: 1,
    }

    await repository.addMany([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([
      {
        ...record,
        id: expect.a(Number),
      },
    ])
  })

  it('adds 0 records', async () => {
    await repository.addMany([])
    expect(await repository.getAll()).toEqual([])
  })

  it('adds multiple records and queries them', async () => {
    const records: Omit<VerifierEventRecord, 'id'>[] = [
      {
        name: 'ImplementationAdded',
        implementation: '0x0000000000000000000000000000000000000000',
        initializer: '0x00000000000000000000000000000000000000000',
        blockNumber: 1,
      },
      {
        name: 'Upgraded',
        implementation: '0x0000000000000000000000000000000000000001',
        blockNumber: 2,
      },
      {
        name: 'ImplementationAdded',
        implementation: '0x0000000000000000000000000000000000000001',
        initializer: '0x0000000000000000000000000000000000000002',
        blockNumber: 2,
      },
    ]

    await repository.addMany(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('deletes all records', async () => {
    await repository.addMany([
      {
        name: 'ImplementationAdded',
        initializer: '0x0000000000000000000000000000000000000001',
        implementation: '0x0000000000000000000000000000000000000002',
        blockNumber: 1,
      },
      {
        name: 'Upgraded',
        implementation: '0x0000000000000000000000000000000000000002',
        blockNumber: 2,
      },
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    await repository.addMany([
      {
        name: 'Upgraded',
        implementation: '0x0000000000000000000000000000000000000001',
        blockNumber: 1,
      },
      {
        name: 'Upgraded',
        implementation: '0x0000000000000000000000000000000000000002',
        blockNumber: 2,
      },
      {
        name: 'Upgraded',
        implementation: '0x0000000000000000000000000000000000000003',
        blockNumber: 3,
      },
    ])

    await repository.deleteAfter(2)

    const actual = await repository.getAll()
    expect(actual).toEqual([
      {
        name: 'Upgraded',
        implementation: '0x0000000000000000000000000000000000000001',
        blockNumber: 1,
        id: expect.a(Number),
      },
      {
        name: 'Upgraded',
        implementation: '0x0000000000000000000000000000000000000002',
        blockNumber: 2,
        id: expect.a(Number),
      },
    ])
  })
})
