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
      dummyFactToPageRecord(1),
      dummyFactToPageRecord(2),
      dummyFactToPageRecord(3),
    ]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('deletes all records', async () => {
    await repository.add([dummyFactToPageRecord(1), dummyFactToPageRecord(2)])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    await repository.add(
      Array.from({ length: 10 }).map((_, i) => dummyFactToPageRecord(i))
    )

    await repository.deleteAllAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(
      Array.from({ length: 6 }).map((_, i) => ({
        ...dummyFactToPageRecord(i),
        id: expect.a(Number),
      }))
    )
  })
})

function dummyFactToPageRecord(blockNumber: number): FactToPageRecord {
  return {
    blockNumber,
    pageHash: `{{ page hash ${blockNumber} }}`,
    factHash: `{{ factHash hash ${blockNumber} }}`,
  }
}
