import { expect } from 'earljs'

import {
  StateTransitionFactRecord,
  StateTransitionFactRepository,
} from '../../../src/peripherals/database/StateTransitionFactsRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(StateTransitionFactRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new StateTransitionFactRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: StateTransitionFactRecord = {
      blockNumber: 1,
      hash: '0x1234567890',
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

  it('adds multiple records and queries them', async () => {
    const records: StateTransitionFactRecord[] = [
      dummyStateTransitionFactRecord({ blockNumber: 1, hash: '0x123' }),
      dummyStateTransitionFactRecord({ blockNumber: 2, hash: '0x456' }),
      dummyStateTransitionFactRecord({ blockNumber: 3, hash: '0x789' }),
    ]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('deletes all records', async () => {
    await repository.add([
      dummyStateTransitionFactRecord({ blockNumber: 1, hash: '0x123' }),
      dummyStateTransitionFactRecord({ blockNumber: 2, hash: '0x456' }),
      dummyStateTransitionFactRecord({ blockNumber: 3, hash: '0x789' }),
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    await repository.add([
      dummyStateTransitionFactRecord({ blockNumber: 1 }),
      dummyStateTransitionFactRecord({ blockNumber: 2 }),
      dummyStateTransitionFactRecord({ blockNumber: 3 }),
      dummyStateTransitionFactRecord({ blockNumber: 4 }),
      dummyStateTransitionFactRecord({ blockNumber: 5 }),
    ])

    await repository.deleteAllAfter(2)

    const actual = await repository.getAll()
    expect(actual).toEqual([
      dummyStateTransitionFactRecord({ blockNumber: 1, id: expect.a(Number) }),
      dummyStateTransitionFactRecord({ blockNumber: 2, id: expect.a(Number) }),
    ])
  })
})

function dummyStateTransitionFactRecord({
  id,
  blockNumber = 0,
  hash = '0x',
}: Partial<StateTransitionFactRecord>): StateTransitionFactRecord {
  return { id, blockNumber, hash }
}
