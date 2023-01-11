import { Hash256 } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import {
  PageMappingRecord,
  PageMappingRepository,
} from './PageMappingRepository'

describe(PageMappingRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new PageMappingRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: Omit<PageMappingRecord, 'id'> = {
      blockNumber: 1,
      pageIndex: 0,
      stateTransitionHash: Hash256.fake(),
      pageHash: Hash256.fake(),
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
    const records = [
      dummyPageMappingRecord({ pageIndex: 0 }),
      dummyPageMappingRecord({ pageIndex: 1 }),
      dummyPageMappingRecord({ pageIndex: 2 }),
    ]

    await repository.addMany(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('deletes all records', async () => {
    await repository.addMany([
      dummyPageMappingRecord({ pageIndex: 0 }),
      dummyPageMappingRecord({ pageIndex: 1 }),
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    const records = Array.from({ length: 10 }).map((_, i) =>
      dummyPageMappingRecord({ blockNumber: i })
    )
    await repository.addMany(records)

    await repository.deleteAllAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(
      records.slice(0, 6).map((r) => ({ ...r, id: expect.a(Number) }))
    )
  })
})

function dummyPageMappingRecord({
  blockNumber = 0,
  pageIndex = 0,
  pageHash = Hash256.fake(),
  stateTransitionHash = Hash256.fake(),
}: Partial<PageMappingRecord>): Omit<PageMappingRecord, 'id'> {
  return {
    blockNumber,
    pageIndex,
    pageHash,
    stateTransitionHash,
  }
}
