import { expect } from 'earljs'

import { FactToPageRepository } from '../../../src/peripherals/database/FactToPageRepository'
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
      data: '{{ data }}',
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
      Array.from({ length: 6 }).map((_, i) => ({
        ...dummyPageRecord(i),
        id: expect.a(Number),
      }))
    )
  })

  describe.only(`with ${FactToPageRepository.name}`, () => {
    const factToPageRepository = new FactToPageRepository(knex, Logger.SILENT)

    afterEach(() => factToPageRepository.deleteAll())

    it('gets pages for ordered by .index and fact hash position in array #1', async () => {
      await factToPageRepository.add([
        { blockNumber: 2, factHash: 'fh2', pageHash: 'ph22', index: 2 },
        { blockNumber: 1, factHash: 'fh1', pageHash: 'ph13', index: 3 },
        { blockNumber: 3, factHash: 'fh2', pageHash: 'ph20', index: 0 },
        { blockNumber: 1, factHash: 'fh1', pageHash: 'ph11', index: 1 },
        { blockNumber: 1, factHash: 'fh2', pageHash: 'ph24', index: 4 },
        { blockNumber: 5, factHash: 'fh2', pageHash: 'ph21', index: 1 },
        { blockNumber: 1, factHash: 'fh1', pageHash: 'ph12', index: 2 },
        { blockNumber: 4, factHash: 'fh1', pageHash: 'ph10', index: 0 },
        { blockNumber: 3, factHash: 'fh2', pageHash: 'ph23', index: 3 },
        { blockNumber: 5, factHash: 'fh1', pageHash: 'ph14', index: 4 },
      ])

      await repository.add([
        { blockNumber: 2, pageHash: 'ph10', data: '{{1-1}}' },
        { blockNumber: 1, pageHash: 'ph11', data: '{{1-2}}' },
        { blockNumber: 3, pageHash: 'ph12', data: '{{1-3}}' },
        { blockNumber: 2, pageHash: 'ph13', data: '{{1-4}}' },
        { blockNumber: 4, pageHash: 'ph14', data: '{{1-5}}' },
        { blockNumber: 2, pageHash: 'ph20', data: '{{2-1}}' },
        { blockNumber: 1, pageHash: 'ph21', data: '{{2-2}}' },
        { blockNumber: 3, pageHash: 'ph22', data: '{{2-3}}' },
        { blockNumber: 2, pageHash: 'ph24', data: '{{2-5}}' },
        { blockNumber: 2, pageHash: 'ph23', data: '{{2-4}}' },
      ])

      const actual = await repository.getAllForFacts(['fh2', 'fh1'])

      expect(format(actual)).toEqual([
        'fh2 {{2-1}}{{2-2}}{{2-3}}{{2-4}}{{2-5}}',
        'fh1 {{1-1}}{{1-2}}{{1-3}}{{1-4}}{{1-5}}',
      ])
    })

    it('gets pages for ordered by .index and fact hash position in array #2', async () => {
      await factToPageRepository.add([
        { blockNumber: 3, factHash: 'fh2', pageHash: 'ph20', index: 0 },
        { blockNumber: 1, factHash: 'fh1', pageHash: 'ph11', index: 1 },
        { blockNumber: 3, factHash: 'fh3', pageHash: 'ph30', index: 0 },
        { blockNumber: 5, factHash: 'fh2', pageHash: 'ph21', index: 1 },
        { blockNumber: 4, factHash: 'fh1', pageHash: 'ph10', index: 0 },
        { blockNumber: 3, factHash: 'fh3', pageHash: 'ph31', index: 1 },
      ])

      await repository.add([
        { blockNumber: 2, pageHash: 'ph10', data: '{{1-0}}' },
        { blockNumber: 1, pageHash: 'ph11', data: '{{1-1}}' },
        { blockNumber: 2, pageHash: 'ph20', data: '{{2-0}}' },
        { blockNumber: 1, pageHash: 'ph21', data: '{{2-1}}' },
        { blockNumber: 2, pageHash: 'ph30', data: '{{3-0}}' },
        { blockNumber: 2, pageHash: 'ph31', data: '{{3-1}}' },
      ])

      const actual = await repository.getAllForFacts(['fh1', 'fh2', 'fh3'])

      expect(format(actual)).toEqual([
        'fh1 {{1-0}}{{1-1}}',
        'fh2 {{2-0}}{{2-1}}',
        'fh3 {{3-0}}{{3-1}}',
      ])
    })

    function format(xs: { factHash: string; pages: string[] }[]) {
      return xs.map((x) => `${x.factHash} ${x.pages.join('')}`.trim())
    }
  })
})

function dummyPageRecord(blockNumber: number): PageRecord {
  return {
    blockNumber,
    data: `{{ data ${blockNumber} }}`,
    pageHash: `{{ page hash ${blockNumber} }}`,
  }
}
