import { expect } from 'earljs'
import { uniqueId } from 'lodash'

import {
  BlockRecord,
  BlockRepository,
} from '../../../src/peripherals/database/BlockRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(BlockRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new BlockRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: BlockRecord = { number: 1, hash: 'h1' }

    await repository.add([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([record])
  })

  it('adds multiple records and queries them', async () => {
    const records: BlockRecord[] = [
      { number: 1, hash: 'h1' },
      { number: 2, hash: 'h2' },
      { number: 3, hash: 'h3' },
    ]

    await repository.add(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records)
  })

  it('deletes all records', async () => {
    await repository.add([
      { number: 1, hash: 'h1' },
      { number: 2, hash: 'h2' },
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    const records: BlockRecord[] = Array.from({ length: 10 }).map((_, i) => ({
      hash: 'h' + i,
      number: i,
    }))
    await repository.add(records)

    await repository.deleteAllAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(records.filter((r) => r.number <= 5))
  })

  it('gets by hash', async () => {
    const record = { number: 1, hash: 'hash--test-get-by-hash' }

    await repository.add([record])

    expect(await repository.getByHash(record.hash)).toEqual(record)

    expect(await repository.getByHash('hash--not-found')).toEqual(undefined)
  })

  it('gets by number', async () => {
    const record = { number: 1, hash: 'hash--test-get-by-number' }

    await repository.add([record])

    expect(await repository.getByNumber(record.number)).toEqual(record)

    expect(await repository.getByNumber(2)).toEqual(undefined)
  })

  it('gets last by number', async () => {
    // Empty repository will return hardcoded earliest block
    expect(await repository.getLast()).toEqual({
      number: 11813207,
      hash: '0xe191f743db9d988ff2dbeda3ec800954445f61cf8e79cc458ba831965e628e8d',
    })

    const block = { number: 11813208, hash: uniqueId('get-last-') }
    await repository.add([block])

    expect(await repository.getLast()).toEqual(block)

    const earlierBlock = { number: 11813206, hash: uniqueId('get-last-') }
    const laterBlock = { number: 11813209, hash: uniqueId('get-last-') }
    await repository.add([laterBlock, earlierBlock])

    expect(await repository.getLast()).toEqual(laterBlock)
  })

  it('gets first by number', async () => {
    expect(await repository.getFirst()).toEqual({
      number: 11813207,
      hash: '0xe191f743db9d988ff2dbeda3ec800954445f61cf8e79cc458ba831965e628e8d',
    })

    const record8 = { number: 11813208, hash: uniqueId('get-first-') }
    await repository.add([record8])

    expect(await repository.getFirst()).toEqual(record8)

    const earlierBlock = { number: 11813206, hash: uniqueId('get-first-') }
    const laterBlock = { number: 11813209, hash: uniqueId('get-first-') }
    await repository.add([laterBlock, earlierBlock])

    expect(await repository.getFirst()).toEqual(earlierBlock)
  })
})
