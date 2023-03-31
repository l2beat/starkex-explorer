import { Hash256 } from '@explorer/types'
import { expect } from 'earl'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import {
  PageMappingRecord,
  PageMappingRepository,
} from './PageMappingRepository'
import { PageRecord, PageRepository } from './PageRepository'

describe(PageRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new PageRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: Omit<PageRecord, 'id'> = {
      blockNumber: 1,
      pageHash: Hash256.fake(),
      data: '11223344',
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

  it('adds multiple records and queries them', async () => {
    const records = [dummyPage(10), dummyPage(11), dummyPage(12)]

    await repository.addMany(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records.map((r) => ({ ...r, id: expect.a(Number) })))
  })

  it('deletes all records', async () => {
    await repository.addMany([dummyPage(1), dummyPage(2)])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    const records = Array.from({ length: 10 }).map((_, i) => dummyPage(i))
    await repository.addMany(records)

    await repository.deleteAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(
      records.slice(0, 6).map((r) => ({ ...r, id: expect.a(Number) }))
    )
  })

  describe(`with ${PageMappingRepository.name}`, () => {
    const pageMappingRepository = new PageMappingRepository(
      database,
      Logger.SILENT
    )

    afterEach(() => pageMappingRepository.deleteAll())

    it('gets pages for ordered by .index and state transition hash position in array #1', async () => {
      await pageMappingRepository.addMany([
        dummyPageMapping(200, Hash256.fake('ff02'), Hash256.fake('aa22'), 2),
        dummyPageMapping(100, Hash256.fake('ff01'), Hash256.fake('aa13'), 3),
        dummyPageMapping(200, Hash256.fake('ff02'), Hash256.fake('aa20'), 0),
        dummyPageMapping(100, Hash256.fake('ff01'), Hash256.fake('aa11'), 1),
        dummyPageMapping(200, Hash256.fake('ff02'), Hash256.fake('aa24'), 4),
        dummyPageMapping(200, Hash256.fake('ff02'), Hash256.fake('aa21'), 1),
        dummyPageMapping(100, Hash256.fake('ff01'), Hash256.fake('aa12'), 2),
        dummyPageMapping(100, Hash256.fake('ff01'), Hash256.fake('aa10'), 0),
        dummyPageMapping(200, Hash256.fake('ff02'), Hash256.fake('aa23'), 3),
        dummyPageMapping(100, Hash256.fake('ff01'), Hash256.fake('aa14'), 4),
      ])

      await repository.addMany([
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

      const pageGroups = await repository.getByStateTransitions([
        Hash256.fake('ff02'),
        Hash256.fake('ff01'),
      ])

      expect(pageGroups).toEqual([
        ['{{2-1}}', '{{2-2}}', '{{2-3}}', '{{2-4}}', '{{2-5}}'],
        ['{{1-1}}', '{{1-2}}', '{{1-3}}', '{{1-4}}', '{{1-5}}'],
      ])
    })

    it('gets pages for ordered by .index and state transition hash position in array #2', async () => {
      await pageMappingRepository.addMany([
        dummyPageMapping(200, Hash256.fake('ff02'), Hash256.fake('aa20'), 0),
        dummyPageMapping(100, Hash256.fake('ff01'), Hash256.fake('aa11'), 1),
        dummyPageMapping(300, Hash256.fake('ff03'), Hash256.fake('aa30'), 0),
        dummyPageMapping(200, Hash256.fake('ff02'), Hash256.fake('aa21'), 1),
        dummyPageMapping(100, Hash256.fake('ff01'), Hash256.fake('aa10'), 0),
        dummyPageMapping(300, Hash256.fake('ff03'), Hash256.fake('aa31'), 1),
      ])

      await repository.addMany([
        dummyPage(2, Hash256.fake('aa10'), '{{1-0}}'),
        dummyPage(1, Hash256.fake('aa11'), '{{1-1}}'),
        dummyPage(2, Hash256.fake('aa20'), '{{2-0}}'),
        dummyPage(1, Hash256.fake('aa21'), '{{2-1}}'),
        dummyPage(2, Hash256.fake('aa30'), '{{3-0}}'),
        dummyPage(2, Hash256.fake('aa31'), '{{3-1}}'),
      ])

      const pageGroups = await repository.getByStateTransitions([
        Hash256.fake('ff01'),
        Hash256.fake('ff02'),
        Hash256.fake('ff03'),
      ])

      expect(pageGroups).toEqual([
        ['{{1-0}}', '{{1-1}}'],
        ['{{2-0}}', '{{2-1}}'],
        ['{{3-0}}', '{{3-1}}'],
      ])
    })

    it('handles multiple mappings and pages', async () => {
      await pageMappingRepository.addMany([
        dummyPageMapping(100, Hash256.fake('ff01'), Hash256.fake('aa11'), 0),
        dummyPageMapping(100, Hash256.fake('ff01'), Hash256.fake('aa22'), 1),
        dummyPageMapping(200, Hash256.fake('ff01'), Hash256.fake('aa11'), 0),
        dummyPageMapping(200, Hash256.fake('ff01'), Hash256.fake('aa22'), 1),

        dummyPageMapping(300, Hash256.fake('ff02'), Hash256.fake('bb11'), 0),
        dummyPageMapping(400, Hash256.fake('ff02'), Hash256.fake('bb11'), 0),
        dummyPageMapping(400, Hash256.fake('ff02'), Hash256.fake('bb22'), 1),

        dummyPageMapping(500, Hash256.fake('ff03'), Hash256.fake('cc11'), 0),
        dummyPageMapping(500, Hash256.fake('ff03'), Hash256.fake('cc22'), 1),
        dummyPageMapping(600, Hash256.fake('ff03'), Hash256.fake('cc11'), 0),
      ])

      await repository.addMany([
        dummyPage(90, Hash256.fake('aa11'), '{{old-1}}'),
        dummyPage(90, Hash256.fake('aa22'), '{{old-2}}'),
        dummyPage(190, Hash256.fake('aa11'), '{{new-1}}'),
        dummyPage(190, Hash256.fake('aa22'), '{{new-2}}'),
        dummyPage(123, Hash256.fake('bb11'), '{{2-1}}'),
        dummyPage(124, Hash256.fake('bb22'), '{{2-2}}'),
        dummyPage(411, Hash256.fake('cc11'), '{{3-1}}'),
        dummyPage(412, Hash256.fake('cc22'), '{{3-2}}'),
      ])

      const pageGroups = await repository.getByStateTransitions([
        Hash256.fake('ff01'),
        Hash256.fake('ff02'),
        Hash256.fake('ff03'),
      ])

      expect(pageGroups).toEqual([
        ['{{new-1}}', '{{new-2}}'],
        ['{{2-1}}', '{{2-2}}'],
        ['{{3-1}}'],
      ])
    })
  })
})

function dummyPage(
  blockNumber: number,
  pageHash = Hash256.fake(),
  data = `{{ data ${blockNumber} }}`
): Omit<PageRecord, 'id'> {
  return {
    blockNumber,
    pageHash,
    data,
  }
}

function dummyPageMapping(
  blockNumber: number,
  stateTransitionHash: Hash256,
  pageHash: Hash256,
  pageIndex: number
): Omit<PageMappingRecord, 'id'> {
  return {
    blockNumber,
    stateTransitionHash,
    pageHash,
    pageIndex,
  }
}
