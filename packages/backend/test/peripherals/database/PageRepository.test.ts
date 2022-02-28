import { Hash256 } from '@explorer/types'
import { expect } from 'earljs'

import {
  FactToPageRecord,
  FactToPageRepository,
} from '../../../src/peripherals/database/FactToPageRepository'
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
      pageHash: Hash256.fake(),
      data: '11223344',
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
    const records = Array.from({ length: 10 }).map((_, i) => dummyPageRecord(i))
    await repository.add(records)

    await repository.deleteAllAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(
      records.slice(0, 6).map((r) => ({ ...r, id: expect.a(Number) }))
    )
  })

  describe(`with ${FactToPageRepository.name}`, () => {
    const factToPageRepository = new FactToPageRepository(knex, Logger.SILENT)

    afterEach(() => factToPageRepository.deleteAll())

    it('gets pages for ordered by .index and fact hash position in array #1', async () => {
      await factToPageRepository.add([
        dummyFactToPageRecord(2, Hash256.fake('ff02'), Hash256.fake('aa22'), 2),
        dummyFactToPageRecord(1, Hash256.fake('ff01'), Hash256.fake('aa13'), 3),
        dummyFactToPageRecord(3, Hash256.fake('ff02'), Hash256.fake('aa20'), 0),
        dummyFactToPageRecord(1, Hash256.fake('ff01'), Hash256.fake('aa11'), 1),
        dummyFactToPageRecord(1, Hash256.fake('ff02'), Hash256.fake('aa24'), 4),
        dummyFactToPageRecord(5, Hash256.fake('ff02'), Hash256.fake('aa21'), 1),
        dummyFactToPageRecord(1, Hash256.fake('ff01'), Hash256.fake('aa12'), 2),
        dummyFactToPageRecord(4, Hash256.fake('ff01'), Hash256.fake('aa10'), 0),
        dummyFactToPageRecord(3, Hash256.fake('ff02'), Hash256.fake('aa23'), 3),
        dummyFactToPageRecord(5, Hash256.fake('ff01'), Hash256.fake('aa14'), 4),
      ])

      await repository.add([
        dummyPageRecord(2, Hash256.fake('aa10'), '{{1-1}}'),
        dummyPageRecord(1, Hash256.fake('aa11'), '{{1-2}}'),
        dummyPageRecord(3, Hash256.fake('aa12'), '{{1-3}}'),
        dummyPageRecord(2, Hash256.fake('aa13'), '{{1-4}}'),
        dummyPageRecord(4, Hash256.fake('aa14'), '{{1-5}}'),
        dummyPageRecord(2, Hash256.fake('aa20'), '{{2-1}}'),
        dummyPageRecord(1, Hash256.fake('aa21'), '{{2-2}}'),
        dummyPageRecord(3, Hash256.fake('aa22'), '{{2-3}}'),
        dummyPageRecord(2, Hash256.fake('aa24'), '{{2-5}}'),
        dummyPageRecord(2, Hash256.fake('aa23'), '{{2-4}}'),
      ])

      const actual = await repository.getAllForFacts([
        Hash256.fake('ff02'),
        Hash256.fake('ff01'),
      ])

      expect(format(actual)).toEqual([
        '0xff02 {{2-1}}{{2-2}}{{2-3}}{{2-4}}{{2-5}}',
        '0xff01 {{1-1}}{{1-2}}{{1-3}}{{1-4}}{{1-5}}',
      ])
    })

    it('gets pages for ordered by .index and fact hash position in array #2', async () => {
      await factToPageRepository.add([
        dummyFactToPageRecord(3, Hash256.fake('ff02'), Hash256.fake('aa20'), 0),
        dummyFactToPageRecord(1, Hash256.fake('ff01'), Hash256.fake('aa11'), 1),
        dummyFactToPageRecord(3, Hash256.fake('ff03'), Hash256.fake('aa30'), 0),
        dummyFactToPageRecord(5, Hash256.fake('ff02'), Hash256.fake('aa21'), 1),
        dummyFactToPageRecord(4, Hash256.fake('ff01'), Hash256.fake('aa10'), 0),
        dummyFactToPageRecord(3, Hash256.fake('ff03'), Hash256.fake('aa31'), 1),
      ])

      await repository.add([
        dummyPageRecord(2, Hash256.fake('aa10'), '{{1-0}}'),
        dummyPageRecord(1, Hash256.fake('aa11'), '{{1-1}}'),
        dummyPageRecord(2, Hash256.fake('aa20'), '{{2-0}}'),
        dummyPageRecord(1, Hash256.fake('aa21'), '{{2-1}}'),
        dummyPageRecord(2, Hash256.fake('aa30'), '{{3-0}}'),
        dummyPageRecord(2, Hash256.fake('aa31'), '{{3-1}}'),
      ])

      const actual = await repository.getAllForFacts([
        Hash256.fake('ff01'),
        Hash256.fake('ff02'),
        Hash256.fake('ff03'),
      ])

      expect(format(actual)).toEqual([
        '0xff01 {{1-0}}{{1-1}}',
        '0xff02 {{2-0}}{{2-1}}',
        '0xff03 {{3-0}}{{3-1}}',
      ])
    })

    function format(xs: { factHash: Hash256; pages: string[] }[]) {
      return xs.map((x) =>
        `${x.factHash.slice(0, 6)} ${x.pages.join('')}`.trim()
      )
    }
  })
})

function dummyPageRecord(
  blockNumber: number,
  pageHash = Hash256.fake(),
  data = `{{ data ${blockNumber} }}`
): PageRecord {
  return {
    blockNumber,
    pageHash,
    data,
  }
}

function dummyFactToPageRecord(
  blockNumber: number,
  factHash: Hash256,
  pageHash: Hash256,
  index: number
): FactToPageRecord {
  return {
    blockNumber,
    factHash,
    pageHash,
    index,
  }
}
