import { expect } from 'chai'

import {
  VerifierEventRecord,
  VerifierEventRepository,
} from '../../../src/peripherals/database/VerifierEventRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(VerifierEventRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new VerifierEventRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: VerifierEventRecord = {
      name: 'ImplementationAdded',
      implementation: '0x0000000000000000000000000000000000000000',
      initializer: '0x0000000000000000000000000000000000000000',
      blockNumber: 1,
    }

    await repository.add([record])

    const actual = await repository.getAll()

    expect(actual[0]).to.include(record)
  })

  it('adds multiple records and queries them', async () => {
    const records: VerifierEventRecord[] = [
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

    await repository.add(records)
    const actual = await repository.getAll()

    // @todo earl's `id: expect.any(Number)`
    expect(actual[0]).to.include(records[0])
    expect(actual[1]).to.include(records[1])
    expect(actual[2]).to.include(records[2])
  })

  it('deletes all records', async () => {
    await repository.add([
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
    expect(actual).to.deep.eq([])
  })
})
