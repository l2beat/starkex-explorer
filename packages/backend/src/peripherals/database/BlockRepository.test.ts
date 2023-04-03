import { Hash256 } from '@explorer/types'
import { expect } from 'earl'
import { range } from 'lodash'

import { setupDatabaseTestSuite } from '../../test/database'
import { Logger } from '../../tools/Logger'
import { BlockRecord, BlockRepository } from './BlockRepository'

describe(BlockRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new BlockRepository(database, Logger.SILENT)

  before(() => repository.deleteAll())
  afterEach(() => repository.deleteAll())

  it('adds single record and queries it', async () => {
    const record: BlockRecord = { number: 1, hash: Hash256.fake() }

    await repository.addMany([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([record])
  })

  it('adds 0 records', async () => {
    await repository.addMany([])
    expect(await repository.getAll()).toEqual([])
  })

  it('adds multiple records and queries them', async () => {
    const records: BlockRecord[] = [
      { number: 1, hash: Hash256.fake() },
      { number: 2, hash: Hash256.fake() },
      { number: 3, hash: Hash256.fake() },
    ]

    await repository.addMany(records)
    const actual = await repository.getAll()

    expect(actual).toEqual(records)
  })

  it('deletes all records', async () => {
    await repository.addMany([
      { number: 1, hash: Hash256.fake() },
      { number: 2, hash: Hash256.fake() },
    ])

    await repository.deleteAll()

    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })

  it('deletes all records after a block number', async () => {
    const records: BlockRecord[] = Array.from({ length: 10 }).map((_, i) => ({
      hash: Hash256.fake(),
      number: i,
    }))
    await repository.addMany(records)

    await repository.deleteAfter(5)

    const actual = await repository.getAll()
    expect(actual).toEqual(records.filter((r) => r.number <= 5))
  })

  it('gets by hash', async () => {
    const record = { number: 1, hash: Hash256.fake() }

    await repository.addMany([record])

    expect(await repository.findByHash(record.hash)).toEqual(record)

    expect(await repository.findByHash(Hash256.fake('000'))).toEqual(undefined)
  })

  it('gets by number', async () => {
    const record = { number: 1, hash: Hash256.fake() }

    await repository.addMany([record])

    expect(await repository.findByNumber(record.number)).toEqual(record)

    expect(await repository.findByNumber(2)).toEqual(undefined)
  })

  it('gets last by number', async () => {
    expect(await repository.findLast()).toEqual(undefined)

    const block = { number: 11813208, hash: Hash256.fake() }
    await repository.addMany([block])

    expect(await repository.findLast()).toEqual(block)

    const earlierBlock = { number: 11813206, hash: Hash256.fake() }
    const laterBlock = { number: 11813209, hash: Hash256.fake() }
    await repository.addMany([laterBlock, earlierBlock])

    expect(await repository.findLast()).toEqual(laterBlock)
  })

  it('gets all blocks in range between given numbers (inclusive)', async () => {
    const blocks = range(10, 20).map((i) => ({
      number: i,
      hash: Hash256.fake(),
    }))
    await repository.addMany(blocks)

    expect(await repository.getAllInRange(13, 17)).toEqual(blocks.slice(3, 8))
  })
})
