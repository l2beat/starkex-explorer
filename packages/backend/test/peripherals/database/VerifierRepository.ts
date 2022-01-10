import { expect } from 'chai'

import {
  VerifierRecord,
  VerifierRepository,
} from '../../../src/peripherals/database/VerifierRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(VerifierRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new VerifierRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: VerifierRecord = {
      address: '0x894c4a12548FB18EaA48cF34f9Cd874Fc08b7FC3',
      blockNumber: 13978446,
    }
    await repository.addOrUpdate([record])

    const actual = await repository.getAll()

    expect(actual).to.deep.eq([record])
  })

  it('adds multiple records and queries them', async () => {
    const records: VerifierRecord[] = [
      {
        address: '0x0000000000000000000000000000000000000001',
        blockNumber: 1,
      },
      {
        address: '0x0000000000000000000000000000000000000002',
        blockNumber: 2,
      },
      {
        address: '0x0000000000000000000000000000000000000003',
        blockNumber: 3,
      },
    ]

    await repository.addOrUpdate(records)
    const actual = await repository.getAll()
    expect(actual).to.deep.eq(records)
  })

  it('deletes all records', async () => {
    await repository.addOrUpdate([
      {
        address: '0x0000000000000000000000000000000000000004',
        blockNumber: 4,
      },
      {
        address: '0x0000000000000000000000000000000000000005',
        blockNumber: 5,
      },
      {
        address: '0x0000000000000000000000000000000000000006',
        blockNumber: 6,
      },
    ])
    await repository.deleteAll()
    const actual = await repository.getAll()
    expect(actual).to.deep.eq([])
  })
})
