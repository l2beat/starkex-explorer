import { Hash256 } from '@explorer/types'
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
    const record = dummyRecord({ blockNumber: 1 })

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
    const records = [
      dummyRecord({ blockNumber: 1 }),
      dummyRecord({ blockNumber: 2 }),
      dummyRecord({ blockNumber: 3 }),
    ]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('adds 0 records', async () => {
    await repository.add([])
    expect(await repository.getAll()).toEqual([])
  })

  it('deletes all records', async () => {
    await repository.add([
      dummyRecord({ blockNumber: 1 }),
      dummyRecord({ blockNumber: 2 }),
      dummyRecord({ blockNumber: 3 }),
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    const records = [
      dummyRecord({ blockNumber: 1 }),
      dummyRecord({ blockNumber: 2 }),
      dummyRecord({ blockNumber: 3 }),
      dummyRecord({ blockNumber: 4 }),
      dummyRecord({ blockNumber: 5 }),
    ]
    await repository.add(records)

    await repository.deleteAllAfter(2)

    const actual = await repository.getAll()
    expect(actual).toEqual(
      records.slice(0, 2).map((r) => ({ ...r, id: expect.a(Number) }))
    )
  })
})

function dummyRecord({
  id,
  blockNumber = 0,
  hash = Hash256.fake(),
}: Partial<StateTransitionFactRecord>): StateTransitionFactRecord {
  return { id, blockNumber, hash }
}
