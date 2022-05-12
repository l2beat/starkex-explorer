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
    const records: PageRecord[] = [dummyPage(10), dummyPage(11), dummyPage(12)]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('deletes all records', async () => {
    await repository.add([dummyPage(1), dummyPage(2)])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    const records = Array.from({ length: 10 }).map((_, i) => dummyPage(i))
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
      await factToPageRepository.addMany([
        dummyFactToPage(200, Hash256.fake('ff02'), Hash256.fake('aa22'), 2),
        dummyFactToPage(100, Hash256.fake('ff01'), Hash256.fake('aa13'), 3),
        dummyFactToPage(200, Hash256.fake('ff02'), Hash256.fake('aa20'), 0),
        dummyFactToPage(100, Hash256.fake('ff01'), Hash256.fake('aa11'), 1),
        dummyFactToPage(200, Hash256.fake('ff02'), Hash256.fake('aa24'), 4),
        dummyFactToPage(200, Hash256.fake('ff02'), Hash256.fake('aa21'), 1),
        dummyFactToPage(100, Hash256.fake('ff01'), Hash256.fake('aa12'), 2),
        dummyFactToPage(100, Hash256.fake('ff01'), Hash256.fake('aa10'), 0),
        dummyFactToPage(200, Hash256.fake('ff02'), Hash256.fake('aa23'), 3),
        dummyFactToPage(100, Hash256.fake('ff01'), Hash256.fake('aa14'), 4),
      ])

      await repository.add([
        dummyPage(2, Hash256.fake('aa10'), '{{1-1}}'),
        dummyPage(1, Hash256.fake('aa11'), '{{1-2}}'),
        dummyPage(3, Hash256.fake('aa12'), '{{1-3}}'),
        dummyPage(2, Hash256.fake('aa13'), '{{1-4}}'),
        dummyPage(4, Hash256.fake('aa14'), '{{1-5}}'),
        dummyPage(2, Hash256.fake('aa20'), '{{2-1}}'),
        dummyPage(1, Hash256.fake('aa21'), '{{2-2}}'),
        dummyPage(3, Hash256.fake('aa22'), '{{2-3}}'),
        dummyPage(2, Hash256.fake('aa24'), '{{2-5}}'),
        dummyPage(2, Hash256.fake('aa23'), '{{2-4}}'),
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
      await factToPageRepository.addMany([
        dummyFactToPage(200, Hash256.fake('ff02'), Hash256.fake('aa20'), 0),
        dummyFactToPage(100, Hash256.fake('ff01'), Hash256.fake('aa11'), 1),
        dummyFactToPage(300, Hash256.fake('ff03'), Hash256.fake('aa30'), 0),
        dummyFactToPage(200, Hash256.fake('ff02'), Hash256.fake('aa21'), 1),
        dummyFactToPage(100, Hash256.fake('ff01'), Hash256.fake('aa10'), 0),
        dummyFactToPage(300, Hash256.fake('ff03'), Hash256.fake('aa31'), 1),
      ])

      await repository.add([
        dummyPage(2, Hash256.fake('aa10'), '{{1-0}}'),
        dummyPage(1, Hash256.fake('aa11'), '{{1-1}}'),
        dummyPage(2, Hash256.fake('aa20'), '{{2-0}}'),
        dummyPage(1, Hash256.fake('aa21'), '{{2-1}}'),
        dummyPage(2, Hash256.fake('aa30'), '{{3-0}}'),
        dummyPage(2, Hash256.fake('aa31'), '{{3-1}}'),
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

    it('handles multiple mappings and pages', async () => {
      await factToPageRepository.addMany([
        dummyFactToPage(100, Hash256.fake('ff01'), Hash256.fake('aa11'), 0),
        dummyFactToPage(100, Hash256.fake('ff01'), Hash256.fake('aa22'), 1),
        dummyFactToPage(200, Hash256.fake('ff01'), Hash256.fake('aa11'), 0),
        dummyFactToPage(200, Hash256.fake('ff01'), Hash256.fake('aa22'), 1),

        dummyFactToPage(300, Hash256.fake('ff02'), Hash256.fake('bb11'), 0),
        dummyFactToPage(400, Hash256.fake('ff02'), Hash256.fake('bb11'), 0),
        dummyFactToPage(400, Hash256.fake('ff02'), Hash256.fake('bb22'), 1),

        dummyFactToPage(500, Hash256.fake('ff03'), Hash256.fake('cc11'), 0),
        dummyFactToPage(500, Hash256.fake('ff03'), Hash256.fake('cc22'), 1),
        dummyFactToPage(600, Hash256.fake('ff03'), Hash256.fake('cc11'), 0),
      ])

      await repository.add([
        dummyPage(90, Hash256.fake('aa11'), '{{old-1}}'),
        dummyPage(90, Hash256.fake('aa22'), '{{old-2}}'),
        dummyPage(190, Hash256.fake('aa11'), '{{new-1}}'),
        dummyPage(190, Hash256.fake('aa22'), '{{new-2}}'),
        dummyPage(123, Hash256.fake('bb11'), '{{2-1}}'),
        dummyPage(124, Hash256.fake('bb22'), '{{2-2}}'),
        dummyPage(411, Hash256.fake('cc11'), '{{3-1}}'),
        dummyPage(412, Hash256.fake('cc22'), '{{3-2}}'),
      ])

      const actual = await repository.getAllForFacts([
        Hash256.fake('ff01'),
        Hash256.fake('ff02'),
        Hash256.fake('ff03'),
      ])

      expect(format(actual)).toEqual([
        '0xff01 {{new-1}}{{new-2}}',
        '0xff02 {{2-1}}{{2-2}}',
        '0xff03 {{3-1}}',
      ])
    })

    function format(xs: { factHash: Hash256; pages: string[] }[]) {
      return xs.map((x) =>
        `${x.factHash.slice(0, 6)} ${x.pages.join('')}`.trim()
      )
    }
  })
})

function dummyPage(
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

function dummyFactToPage(
  blockNumber: number,
  factHash: Hash256,
  pageHash: Hash256,
  index: number
): Omit<FactToPageRecord, 'id'> {
  return {
    blockNumber,
    factHash,
    pageHash,
    index,
  }
}
