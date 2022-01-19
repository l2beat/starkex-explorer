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
      factHash: '{{ fact hash }}',
      pageHash: '{{ page hash }}',
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
    await repository.add(
      Array.from({ length: 10 }).map((_, i) =>
        dummyFactToPageRecord({ blockNumber: i })
      )
    )

    await repository.deleteAllAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(
      Array.from({ length: 6 }).map((_, i) => ({
        ...dummyFactToPageRecord({ blockNumber: i, index: 0 }),
        id: expect.a(Number),
      }))
    )
  })
})

function dummyFactToPageRecord({
  id,
  blockNumber = 0,
  index = 0,
  pageHash = `{{ page hash ${blockNumber}-${index} }}`,
  factHash = `{{ factHash hash ${blockNumber}-${index} }}`,
}: Partial<FactToPageRecord>): FactToPageRecord {
  return {
    id,
    blockNumber,
    index,
    pageHash,
    factHash,
  }
}
