import { expect } from 'earljs'

import {
  PageRecord,
  PageRepository,
} from '../../../src/peripherals/database/PageRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(PageRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new PageRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: PageRecord = {
      blockNumber: 1,
      pageHash: '{{ page hash }}',
      page: '{{ page }}',
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
    const records: PageRecord[] = [
      dummyPageRecord(10),
      dummyPageRecord(11),
      dummyPageRecord(12),
    ]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('deletes all records', async () => {
    await repository.add([dummyPageRecord(1), dummyPageRecord(2)])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    await repository.add(
      Array.from({ length: 10 }).map((_, i) => dummyPageRecord(i))
    )

    await repository.deleteAllAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(
      Array.from({ length: 6 }).map((_, i) => dummyPageRecord(i))
    )
  })
})

function dummyPageRecord(blockNumber: number): PageRecord {
  return {
    blockNumber,
    page: `{{ page ${blockNumber} }}`,
    pageHash: `{{ page hash ${blockNumber} }}`,
  }
}
