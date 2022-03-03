import { Hash256 } from '@explorer/types'
import { expect } from 'earljs'

import {
  FactToPageRecord,
  FactToPageRepository,
} from '../../../src/peripherals/database/FactToPageRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(FactToPageRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new FactToPageRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: FactToPageRecord = {
      blockNumber: 1,
      index: 0,
      factHash: Hash256.fake(),
      pageHash: Hash256.fake(),
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
    const records: FactToPageRecord[] = [
      dummyFactToPageRecord({ index: 0 }),
      dummyFactToPageRecord({ index: 1 }),
      dummyFactToPageRecord({ index: 2 }),
    ]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('deletes all records', async () => {
    await repository.add([
      dummyFactToPageRecord({ index: 0 }),
      dummyFactToPageRecord({ index: 1 }),
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    const records = Array.from({ length: 10 }).map((_, i) =>
      dummyFactToPageRecord({ blockNumber: i })
    )
    await repository.add(records)

    await repository.deleteAllAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(
      records.slice(0, 6).map((r) => ({ ...r, id: expect.a(Number) }))
    )
  })
})

function dummyFactToPageRecord({
  id,
  blockNumber = 0,
  index = 0,
  pageHash = Hash256.fake(),
  factHash = Hash256.fake(),
}: Partial<FactToPageRecord>): FactToPageRecord {
  return {
    id,
    blockNumber,
    index,
    pageHash,
    factHash,
  }
}
