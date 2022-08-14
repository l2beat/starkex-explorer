import { Hash256 } from '@explorer/types'
import { expect } from 'earljs'

import {
  StateTransitionRecord,
  StateTransitionRepository,
} from '../../../src/peripherals/database/StateTransitionRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './shared/setup'

describe(StateTransitionRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new StateTransitionRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record = dummyRecord({ blockNumber: 1 })

    await repository.addMany([record])

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

    await repository.addMany(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('adds 0 records', async () => {
    await repository.addMany([])
    expect(await repository.getAll()).toEqual([])
  })

  it('deletes all records', async () => {
    await repository.addMany([
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
    await repository.addMany(records)

    await repository.deleteAfter(2)

    const actual = await repository.getAll()
    expect(actual).toEqual(
      records.slice(0, 2).map((r) => ({ ...r, id: expect.a(Number) }))
    )
  })
})

function dummyRecord({
  blockNumber = 0,
  stateTransitionHash = Hash256.fake(),
}: Partial<Omit<StateTransitionRecord, 'id'>>): Omit<
  StateTransitionRecord,
  'id'
> {
  return { blockNumber, stateTransitionHash }
}
